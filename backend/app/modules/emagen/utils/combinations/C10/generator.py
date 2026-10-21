"""
C10 Generation Engine: Non-Fashion + Product only + Identity Form Selected
==========================================================================

Async generation engine for C10 combination with anchor-followup pattern.
Combines C7's non-fashion product logic with C4's house model generation capabilities.
"""

import os, json, io, asyncio, hashlib, logging, uuid, time
import json as jsonlib
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageFilter, ImageDraw

from ...data import select_non_fashion_poses, get_recipe_style
from ...storage_utils import storage_manager
from ...house_model_api import HouseModelSpec, house_model_api
from .prompt_builder import (
    build_c10_anchor_payload, build_c10_followup_payload, get_c10_system_instruction,
    NON_FASHION_PHOTOREALISM_CHARTER as PHOTOREALISM_CHARTER
)

logger = logging.getLogger(__name__)

# ---------- C10 Generation Configuration ----------
C10_MODEL_NAME = "gemini-2.5-flash-image-preview"
C10_GEN_CFG = {"temperature": 0.0, "top_p": 0.0, "top_k": 1}

# ---------- Helper Functions ----------
def _sha256(b: bytes) -> str:
    """Calculate SHA256 hash of bytes"""
    return hashlib.sha256(b).hexdigest() if b else "0"*64

def _img_info(b: bytes, mime_hint: str = None) -> dict:
    """Get image information from bytes"""
    info = {"mime": mime_hint or "unknown", "byte_len": len(b) if b else 0, "width": None, "height": None}
    if not b: 
        return info
    try:
        im = Image.open(io.BytesIO(b))
        info["width"], info["height"] = im.size
        if not mime_hint:
            fmt = (im.format or "").lower()
            info["mime"] = f"image/{fmt}" if fmt else "image/unknown"
    except Exception:
        pass
    return info

def _json_bytes_for_send(payload: dict) -> str:
    """Convert payload to JSON string with sorted keys for stable SHA"""
    return jsonlib.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

def _ensure_io_contract(payload: dict, images_order: dict) -> dict:
    """Ensure I/O contract is present in payload"""
    payload = dict(payload or {})
    io = payload.setdefault("io_contract", {})
    io["images_order"] = images_order
    return payload

def _assert_io_contract_present(jtxt: str):
    """Assert that I/O contract is present in JSON"""
    if '"io_contract"' not in jtxt or '"images_order"' not in jtxt:
        raise AssertionError("I/O contract missing from outgoing JSON")

def _first_image_bytes_from_resp(resp) -> Tuple[Optional[bytes], Optional[bytes]]:
    """
    Extract image bytes from Gemini response
    Returns (png_bytes, jpeg_bytes) - keep raw PNG for identity pass, save JPEG to storage
    """
    raw_png = None
    for cand in getattr(resp, "candidates", []) or []:
        content = getattr(cand, "content", None)
        if content:
            parts = getattr(content, "parts", []) or []
            for part in parts:
                if getattr(part, "inline_data", None) and part.inline_data.mime_type.startswith("image/"):
                    raw_png = part.inline_data.data
                    break
        if raw_png:
            break
    
    if raw_png is None:
        return None, None

    # Convert PNG to high-quality JPEG for storage
    im = Image.open(io.BytesIO(raw_png))
    if im.mode in ("RGBA", "LA"):
        im = im.convert("RGB")
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=95, optimize=True)
    jpeg_bytes = buf.getvalue()
    return raw_png, jpeg_bytes

def _save_bytes_to_storage(bytes_data: bytes, filename: str) -> str:
    """Save bytes to storage and return the URL"""
    import base64
    base64_data = base64.b64encode(bytes_data).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{base64_data}"
    
    # Use save_generated_image method
    result = storage_manager.save_generated_image(
        image_data=image_data,
        prefix="shotpack",
        filename=filename
    )
    
    if result['success']:
        return result['url']  # Return S3 URL instead of local path
    else:
        raise RuntimeError(f"Failed to save image: {result.get('error', 'Unknown error')}")

def make_anchor_canvas_3x4(
    short_side: int = 1536,
    bg=(248, 248, 248),
    border=(210, 210, 210),
    guides=(190, 190, 190),
    headroom_pct: float = 0.06,  # 6% top band
    feet_pct: float = 0.04       # 4% bottom band
) -> bytes:
    """
    Returns PNG bytes for a 3:4 canvas with:
    - light background
    - subtle border
    - headroom band (top)
    - feet band (bottom)
    - center crosshair
    """
    # 3:4 aspect => W:H = 3:4
    H = short_side * 4 // 3 if short_side <= 2048 else 2048
    W = H * 3 // 4

    img = Image.new("RGB", (W, H), bg)
    drw = ImageDraw.Draw(img)

    # border
    drw.rectangle([0, 0, W-1, H-1], outline=border, width=4)

    # bands
    head_h = int(H * headroom_pct)
    feet_h = int(H * feet_pct)
    drw.rectangle([0, 0, W, head_h], fill=None, outline=guides, width=2)
    drw.rectangle([0, H-feet_h, W, H], fill=None, outline=guides, width=2)

    # crosshair
    cx, cy = W // 2, H // 2
    drw.line([(cx, 0), (cx, H)], fill=guides, width=2)
    drw.line([(0, cy), (W, cy)], fill=guides, width=2)

    # faint labels (non-blocking for the model)
    label_col = tuple(max(0, c-30) for c in guides)
    drw.text((10, 10), "HEADROOM", fill=label_col)
    drw.text((10, H - feet_h + 10), "FEET ZONE", fill=label_col)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def _face_crop_from_png(png_bytes: bytes) -> bytes:
    """Create face crop from PNG for identity reference"""
    im = Image.open(io.BytesIO(png_bytes))
    w, h = im.size
    side = int(min(w, h) * 0.7)
    cx, cy = w // 2, int(h * 0.42)  # bias up for hairline
    x0, y0 = max(0, cx - side // 2), max(0, cy - side // 2)
    x1, y1 = min(w, x0 + side), min(h, y0 + side)
    tight = im.crop((x0, y0, x1, y1))
    out = io.BytesIO()
    tight.save(out, format="PNG", optimize=True)
    return out.getvalue()

# ---------- Content Builders ----------
def _make_c10_anchor_contents(*, product_bytes: bytes, identity_bytes: bytes, 
                             composition_canvas_bytes: bytes, json_payload: dict) -> List[Any]:
    """Build contents for C10 anchor generation: product + identity + composition canvas"""
    from google.genai import types as gatypes
    
    images_order = {
        "product_reference": "first_image",
        "identity_source": "second_image",
        "composition_canvas": "third_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    # Determine mime type based on image header
    mime_type = "image/png" if identity_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    
    return [
        jtxt,
        gatypes.Part.from_bytes(mime_type="image/jpeg", data=product_bytes),
        gatypes.Part.from_bytes(mime_type=mime_type, data=identity_bytes),
        gatypes.Part.from_bytes(mime_type="image/png", data=composition_canvas_bytes)
    ]

def _make_c10_followup_contents(*, product_bytes: bytes, anchor_png_full: bytes,
                               anchor_png_face: Optional[bytes], json_payload: dict) -> List[Any]:
    """Build contents for C10 follow-up generation: product + anchor + optional face"""
    from google.genai import types as gatypes
    
    images_order = {
        "product_reference": "first_image",
        "anchor_full": "second_image",
    }
    if anchor_png_face:
        images_order["anchor_face_crop"] = "third_image"

    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    contents = [
        jtxt,
        gatypes.Part.from_bytes(mime_type="image/jpeg", data=product_bytes),
        gatypes.Part.from_bytes(mime_type="image/png", data=anchor_png_full)
    ]
    if anchor_png_face:
        contents.append(gatypes.Part.from_bytes(mime_type="image/png", data=anchor_png_face))
    
    return contents

# ---------- Generation Functions ----------
async def _gen_c10_image_in_thread(*, contents: List[Any], is_anchor: bool = False) -> Any:
    """
    Run a single generate_content call for C10 in a worker thread
    """
    # Choose system instruction based on whether this is anchor or follow-up
    if is_anchor:
        sysinst = get_c10_system_instruction()
        logger.info(f"[C10][ANCHOR] System instruction length: {len(sysinst)}")
    else:
        sysinst = (
            "You are an expert product photographer specializing in pose variations for non-fashion products. "
            "Preserve the model identity, facial features, hair, skin tone, and body proportions from the anchor reference image. "
            "Maintain product integrity, exact appearance, logos, text, and materials exactly as shown in the reference. "
            "Keep the background, lighting, and overall aesthetic consistent with the anchor image. "
            "Only modify the pose according to the specifications in the JSON payload. "
            "Do not alter any other visual elements. "
            "Only modify the pose relative to the anchor image and must make it visibly different. "
            "If the resulting pose matches the anchor (front_full) or violates the numeric bands below, do not reuse the front-full stance; "
            "instead, adjust until the target ranges are satisfied. Identity and product fidelity stay unchanged." + PHOTOREALISM_CHARTER
        )
        logger.info(f"[C10][FOLLOWUP] System instruction length: {len(sysinst)}")

    loop = asyncio.get_running_loop()
    
    def _worker():
        # Use new SDK for generation
        try:
            from google import genai as new_genai
            from google.genai import types as gatypes
            
            client = new_genai.Client()
            
            # Build config with system instruction
            gen_cfg = gatypes.GenerateContentConfig(
                temperature=C10_GEN_CFG.get("temperature", 0.0),
                top_p=C10_GEN_CFG.get("top_p", 0.0),
                top_k=C10_GEN_CFG.get("top_k", 1),
                system_instruction=sysinst,
                response_modalities=["IMAGE"]
            )
            
            mode = "ANCHOR" if is_anchor else "FOLLOWUP"
            logger.info(f"[C10][NEW_SDK][{mode}] Using new SDK for generation")
            
            resp = client.models.generate_content(
                model=C10_MODEL_NAME,
                contents=contents,
                config=gen_cfg,
            )
            
            # Parse response - only expect image
            image_bytes = None
            if hasattr(resp, 'candidates') and resp.candidates:
                candidate = resp.candidates[0]
                if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            image_bytes = part.inline_data.data
                            break
            
            if not image_bytes:
                raise RuntimeError("No image found in Gemini response")
            
            # Create a mock response object that matches the old format for compatibility
            class MockResponse:
                def __init__(self, image_bytes):
                    self.candidates = [MockCandidate(image_bytes)]
            
            class MockCandidate:
                def __init__(self, image_bytes):
                    self.content = MockContent(image_bytes)
            
            class MockContent:
                def __init__(self, image_bytes):
                    self.parts = [MockPart(image_bytes)]
            
            class MockPart:
                def __init__(self, image_bytes):
                    self.inline_data = MockInlineData(image_bytes)
            
            class MockInlineData:
                def __init__(self, image_bytes):
                    self.data = image_bytes
                    self.mime_type = "image/png"
            
            return MockResponse(image_bytes)
            
        except Exception as e:
            logger.error(f"[C10][NEW_SDK][{mode}] Generation failed: {e}")
            raise
    
    resp = await loop.run_in_executor(None, _worker)
    return resp

# ---------- Main Generation Function ----------
async def generate_c10_shotpack(*, recipe: str, product_category: str, product_bytes: bytes, 
                               identity_preset: Dict[str, str]) -> Dict[str, Any]:
    """
    Generate C10 shotpack: Non-Fashion + Product only + Identity Form Selected
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean', 'street-style')
        product_category: Product category (e.g., 'electronics_gadgets', 'health_beauty')
        product_bytes: Product image as bytes
        identity_preset: Identity preset parameters (dict with HouseModelSpec fields)
        
    Returns:
        Dict containing results with image URLs and metadata
    """
    try:
        # Generate consistency token
        token = uuid.uuid4().hex[:12]
        logger.info(f"[C10] Starting generation with token: {token}")
        
        # Generate identity image using house model API
        logger.info(f"[C10] Generating identity image from preset: {identity_preset}")
        house_model_spec = HouseModelSpec(**identity_preset)
        identity_image_data = await house_model_api.generate_model_angle(house_model_spec, "front_full")
        
        if not identity_image_data or not identity_image_data.get('success', False):
            raise RuntimeError(f"Failed to generate identity image: {identity_image_data.get('error', 'Unknown error')}")
        
        identity_bytes = identity_image_data['image_bytes']
        logger.info(f"[C10] Identity image generated: {len(identity_bytes)} bytes")
        
        # Get poses for the recipe and product category
        poses = select_non_fashion_poses(recipe, product_category)
        logger.info(f"[C10] Selected poses: {poses}")
        
        results: List[Dict[str, Any]] = []
        
        # ---------- Anchor Generation (First Pose) ----------
        first_pose = poses[0]
        logger.info(f"[C10] Generating anchor pose: {first_pose}")
        
        # Build anchor payload
        anchor_payload = build_c10_anchor_payload(
            recipe=recipe,
            product_category=product_category,
            pose_label=first_pose,
            consistency_token=token
        )
        
        # Create composition canvas
        composition_canvas_bytes = make_anchor_canvas_3x4()
        
        # Build anchor contents
        anchor_contents = _make_c10_anchor_contents(
            product_bytes=product_bytes,
            identity_bytes=identity_bytes,
            composition_canvas_bytes=composition_canvas_bytes,
            json_payload=anchor_payload
        )
        
        # Generate anchor image
        anchor_resp = await _gen_c10_image_in_thread(contents=anchor_contents, is_anchor=True)
        anchor_png, anchor_jpeg = _first_image_bytes_from_resp(anchor_resp)
        
        if not anchor_png or not anchor_jpeg:
            raise RuntimeError(f"No image generated for anchor pose: {first_pose}")
        
        # Save anchor image
        anchor_filename = f"shotpack_{recipe}_{first_pose}_{token}.jpg"
        anchor_url = _save_bytes_to_storage(anchor_jpeg, anchor_filename)
        results.append({
            "pose": first_pose,
            "success": True,
            "image_url": anchor_url,
            "filename": anchor_filename
        })
        
        logger.info(f"[C10] Anchor generated: {anchor_filename}")
        
        # Prepare identity references for follow-ups
        identity_full_bytes = anchor_png  # Use PNG for identity pass-through
        identity_face_bytes = _face_crop_from_png(anchor_png)
        
        # ---------- Follow-up Generation (Poses 2-4) ----------
        async def _gen_followup_pose(pose_label: str):
            """Generate a single follow-up pose"""
            try:
                logger.info(f"[C10] Generating follow-up pose: {pose_label}")
                
                # Build follow-up payload
                followup_payload = build_c10_followup_payload(
                    recipe=recipe,
                    product_category=product_category,
                    pose_label=pose_label,
                    consistency_token=token
                )
                
                # Build follow-up contents
                followup_contents = _make_c10_followup_contents(
                    product_bytes=product_bytes,
                    anchor_png_full=identity_full_bytes,
                    anchor_png_face=identity_face_bytes,
                    json_payload=followup_payload
                )
                
                # Generate follow-up image
                followup_resp = await _gen_c10_image_in_thread(contents=followup_contents, is_anchor=False)
                followup_png, followup_jpeg = _first_image_bytes_from_resp(followup_resp)
                
                if not followup_jpeg:
                    return {"pose": pose_label, "success": False, "error": "No image generated"}
                
                # Save follow-up image
                followup_filename = f"shotpack_{recipe}_{pose_label}_{token}.jpg"
                followup_url = _save_bytes_to_storage(followup_jpeg, followup_filename)
                
                logger.info(f"[C10] Follow-up generated: {followup_filename}")
                return {
                    "pose": pose_label,
                    "success": True,
                    "image_url": followup_url,
                    "filename": followup_filename
                }
                
            except Exception as e:
                logger.error(f"[C10] Follow-up generation failed for {pose_label}: {str(e)}")
                return {"pose": pose_label, "success": False, "error": str(e)}
        
        # Generate follow-up poses concurrently
        followup_tasks = [asyncio.create_task(_gen_followup_pose(pose)) for pose in poses[1:]]
        followup_results = await asyncio.gather(*followup_tasks, return_exceptions=False)
        results.extend(followup_results)
        
        logger.info(f"[C10] Generation completed. Generated {len(results)} images")
        
        return {
            "results": results,
            "consistency_token": token,
            "recipe": recipe,
            "product_category": product_category,
            "total_poses": len(poses),
            "successful_poses": len([r for r in results if r.get("success", False)]),
            "identity_preset": identity_preset
        }
        
    except Exception as e:
        logger.error(f"[C10] Generation failed: {str(e)}")
        raise RuntimeError(f"C10 shotpack generation failed: {str(e)}")

"""
C1 Generation Engine: Fashion + Product + Uploaded Identity
==========================================================

Async generation engine for C1 combination with anchor-followup pattern.
Adapted for Zambeel backend integration.
"""

import os, json, io, asyncio, hashlib, logging, uuid, time
import json as jsonlib
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

from ...data import select_poses, get_recipe_style
from .prompt_builder import (
    build_c1_anchor_payload, build_c1_followup_payload, get_c1_system_instruction,
    PHOTOREALISM_CHARTER
)

logger = logging.getLogger(__name__)

# ---------- C1 Generation Configuration ----------
C1_MODEL_NAME = "gemini-2.5-flash-image-preview"  # Use C1 Lock's working model for multimodal
C1_GEN_CFG = {"temperature": 0.0, "top_p": 0.0, "top_k": 1}  # Zero sampling for stability

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

def _save_bytes_to_storage(bytes_data: bytes, filename: str, folder: str = "shotpack") -> str:
    """Save bytes to storage and return the path"""
    # Convert bytes to base64 for storage_manager
    import base64
    base64_data = base64.b64encode(bytes_data).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{base64_data}"
    
    # Use save_generated_image method
    from ...storage_utils import storage_manager
    result = storage_manager.save_generated_image(
        image_data=image_data,
        prefix="shotpack",
        filename=filename
    )
    
    if result['success']:
        return result['url']  # Return S3 URL instead of local path
    else:
        raise RuntimeError(f"Failed to save image: {result.get('error', 'Unknown error')}")

# ---------- Content Builders ----------
def _make_c1_anchor_contents(*, product_bytes: bytes, uploaded_identity_bytes: bytes, 
                            json_payload: dict) -> List[Any]:
    """Build contents for C1 anchor generation: product + uploaded identity"""
    images_order = {
        "product_source": "first_image",
        "identity_source": "second_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    # Determine mime type based on image header
    mime_type = "image/png" if uploaded_identity_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    
    from google.genai import types as gatypes
    
    return [
        jtxt,
        gatypes.Part.from_bytes(mime_type="image/jpeg", data=product_bytes),
        gatypes.Part.from_bytes(mime_type=mime_type, data=uploaded_identity_bytes)
    ]

def _make_c1_followup_contents(*, product_bytes: bytes, anchor_png_full: bytes, 
                              anchor_png_face: Optional[bytes], json_payload: dict) -> List[Any]:
    """Build contents for C1 follow-up generation: product + anchor + optional face"""
    images_order = {
        "product_source": "first_image",
        "identity_source": "second_image"
    }
    if anchor_png_face:
        images_order["identity_face_source"] = "third_image"

    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    from google.genai import types as gatypes
    
    contents = [
        jtxt,
        gatypes.Part.from_bytes(mime_type="image/jpeg", data=product_bytes),
        gatypes.Part.from_bytes(mime_type="image/png", data=anchor_png_full)
    ]
    if anchor_png_face:
        contents.append(gatypes.Part.from_bytes(mime_type="image/png", data=anchor_png_face))
    
    return contents

# ---------- Generation Functions ----------
async def _gen_c1_image_in_thread(*, contents: List[Any], is_anchor: bool = False) -> Any:
    """
    Run a single generate_content call for C1 in a worker thread
    """
    # Choose system instruction based on whether this is anchor or follow-up
    if is_anchor:
        sysinst = get_c1_system_instruction()
        logger.info(f"[C1][ANCHOR] System instruction length: {len(sysinst)}")
    else:
        sysinst = (
            "You are an expert product retoucher specializing in pose variations. "
            "Preserve the model identity, facial features, hair, skin tone, and body proportions from the anchor reference image. "
            "Maintain product integrity, fit, fabric texture, and styling exactly as shown in the reference. "
            "Keep the background, lighting, and overall aesthetic consistent with the anchor image. "
            "Only modify the pose according to the specifications in the JSON payload. "
            "Do not alter any other visual elements. "
            "Only modify the pose relative to the anchor image and must make it visibly different. "
            "If the resulting pose matches the anchor (front_full) or violates the numeric bands below, do not reuse the front-full stance; "
            "instead, adjust until the target ranges are satisfied. Identity and garment fidelity stay unchanged." + PHOTOREALISM_CHARTER
        )
        logger.info(f"[C1][FOLLOWUP] System instruction length: {len(sysinst)}")

    loop = asyncio.get_running_loop()
    
    def _worker():
        # Use new SDK for generation (like C3 and C4)
        try:
            from google import genai as new_genai
            from google.genai import types as gatypes
            
            client = new_genai.Client()
            
            # Extract components from contents
            payload_json = contents[0]  # First part is JSON payload
            
            # Build contents with new SDK format
            new_contents = [payload_json]  # JSON payload as string
            
            # Add image parts (they are already gatypes.Part objects)
            for i in range(1, len(contents)):
                img_part = contents[i]
                new_contents.append(img_part)
            
            # Build config with system instruction
            gen_cfg = gatypes.GenerateContentConfig(
                temperature=C1_GEN_CFG.get("temperature", 0.0),
                top_p=C1_GEN_CFG.get("top_p", 0.0),
                top_k=C1_GEN_CFG.get("top_k", 1),
                system_instruction=sysinst,
                response_modalities=["IMAGE"],  # Image-only response
            )
            
            mode = "ANCHOR" if is_anchor else "FOLLOWUP"
            logger.info(f"[C1][NEW_SDK][{mode}] Using new SDK for generation")
            
            # Log everything being sent to Gemini
            logger.info(f"[GEMINI_API][{mode}] ========== GEMINI API CALL ==========")
            logger.info(f"[GEMINI_API][{mode}] Model: {C1_MODEL_NAME}")
            logger.info(f"[GEMINI_API][{mode}] Generation Config: {C1_GEN_CFG}")
            logger.info(f"[GEMINI_API][{mode}] System Instruction Length: {len(sysinst)}")
            logger.info(f"[GEMINI_API][{mode}] Total Contents Count: {len(new_contents)}")
            
            # Log each content item
            for i, content in enumerate(new_contents):
                if isinstance(content, str):
                    logger.info(f"[GEMINI_API][{mode}] Content[{i}] (String): {content[:200]}...")
                elif hasattr(content, 'inline_data'):
                    logger.info(f"[GEMINI_API][{mode}] Content[{i}] (Image): {content.inline_data.mime_type}, {len(content.inline_data.data)} bytes")
                else:
                    logger.info(f"[GEMINI_API][{mode}] Content[{i}] (Other): {type(content)} - {str(content)[:200]}...")
            
            logger.info(f"[GEMINI_API][{mode}] ========== END GEMINI API CALL ==========")
            
            resp = client.models.generate_content(
                model=C1_MODEL_NAME,
                contents=new_contents,
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
            mode = "ANCHOR" if is_anchor else "FOLLOWUP"
            logger.error(f"[C1][NEW_SDK][{mode}] Generation failed: {e}")
            raise
    
    resp = await loop.run_in_executor(None, _worker)
    return resp

# ---------- Main Generation Function ----------
async def generate_c1_shotpack(*, recipe: str, garment_type: str, product_bytes: bytes, 
                              identity_bytes: bytes) -> Dict[str, Any]:
    """
    Generate C1 shotpack: Fashion + Product + Uploaded Identity
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean', 'street-style')
        garment_type: Type of garment (e.g., 'top', 'dress', 'bottom')
        product_bytes: Product image as bytes
        identity_bytes: Uploaded identity image as bytes
        
    Returns:
        Dict containing results with image URLs and metadata
    """
    try:
        # Generate consistency token
        token = uuid.uuid4().hex[:12]
        logger.info(f"[C1] Starting generation with token: {token}")
        
        # Get poses for the recipe and garment type
        poses = select_poses(recipe, garment_type)
        logger.info(f"[C1] Selected poses: {poses}")
        
        results: List[Dict[str, Any]] = []
        
        # ---------- Anchor Generation (First Pose) ----------
        first_pose = poses[0]
        logger.info(f"[C1] Generating anchor pose: {first_pose}")
        
        # Build anchor payload
        anchor_payload = build_c1_anchor_payload(
            recipe=recipe,
            garment_type=garment_type,
            pose_label=first_pose,
            consistency_token=token
        )
        
        # Log anchor payload details
        logger.info(f"[C1][ANCHOR] Payload JSON:\n{json.dumps(anchor_payload, indent=2)}")
        
        # Build anchor contents
        anchor_contents = _make_c1_anchor_contents(
            product_bytes=product_bytes,
            uploaded_identity_bytes=identity_bytes,
            json_payload=anchor_payload
        )
        
        # Log anchor content details
        logger.info(f"[C1][ANCHOR] Content Details:")
        logger.info(f"[C1][ANCHOR] - Product image: {len(product_bytes)} bytes")
        logger.info(f"[C1][ANCHOR] - Identity image: {len(identity_bytes)} bytes")
        logger.info(f"[C1][ANCHOR] - JSON payload: {len(json.dumps(anchor_payload))} chars")
        
        # Generate anchor image
        anchor_resp = await _gen_c1_image_in_thread(contents=anchor_contents, is_anchor=True)
        anchor_png, anchor_jpeg = _first_image_bytes_from_resp(anchor_resp)
        
        if not anchor_png or not anchor_jpeg:
            raise RuntimeError(f"No image generated for anchor pose: {first_pose}")
        
        # Save anchor image
        anchor_filename = f"shotpack_{recipe}_{first_pose}_{token}.jpg"
        anchor_url = _save_bytes_to_storage(anchor_jpeg, anchor_filename)  # This now returns S3 URL
        results.append({
            "pose": first_pose,
            "success": True,
            "image_url": anchor_url,  # Use S3 URL directly
            "filename": anchor_filename
        })
        
        logger.info(f"[C1] Anchor generated: {anchor_filename}")
        
        # Prepare identity references for follow-ups
        identity_full_bytes = anchor_png  # Use PNG for identity pass-through
        identity_face_bytes = _face_crop_from_png(identity_full_bytes)  # Optional face crop
        
        # ---------- Follow-up Generation (Poses 2-4) ----------
        async def _gen_followup_pose(pose_label: str):
            """Generate a single follow-up pose"""
            try:
                logger.info(f"[C1] Generating follow-up pose: {pose_label}")
                
                # Build follow-up payload
                followup_payload = build_c1_followup_payload(
                    recipe=recipe,
                    garment_type=garment_type,
                    pose_label=pose_label,
                    consistency_token=token
                )
                
                # Log follow-up payload details
                logger.info(f"[C1][FOLLOWUP][{pose_label}] Payload JSON:\n{json.dumps(followup_payload, indent=2)}")
                
                # Build follow-up contents
                followup_contents = _make_c1_followup_contents(
                    product_bytes=product_bytes,
                    anchor_png_full=identity_full_bytes,
                    anchor_png_face=identity_face_bytes,
                    json_payload=followup_payload
                )
                
                # Log follow-up content details
                logger.info(f"[C1][FOLLOWUP][{pose_label}] Content Details:")
                logger.info(f"[C1][FOLLOWUP][{pose_label}] - Product image: {len(product_bytes)} bytes")
                logger.info(f"[C1][FOLLOWUP][{pose_label}] - Anchor full: {len(identity_full_bytes)} bytes")
                logger.info(f"[C1][FOLLOWUP][{pose_label}] - Anchor face: {len(identity_face_bytes) if identity_face_bytes else 0} bytes")
                logger.info(f"[C1][FOLLOWUP][{pose_label}] - JSON payload: {len(json.dumps(followup_payload))} chars")
                
                # Generate follow-up image
                followup_resp = await _gen_c1_image_in_thread(contents=followup_contents, is_anchor=False)
                followup_png, followup_jpeg = _first_image_bytes_from_resp(followup_resp)
                
                if not followup_jpeg:
                    return {"pose": pose_label, "success": False, "error": "No image generated"}
                
                # Save follow-up image
                followup_filename = f"shotpack_{recipe}_{pose_label}_{token}.jpg"
                followup_url = _save_bytes_to_storage(followup_jpeg, followup_filename)  # This now returns S3 URL
                
                logger.info(f"[C1] Follow-up generated: {followup_filename}")
                return {
                    "pose": pose_label,
                    "success": True,
                    "image_url": followup_url,
                    "filename": followup_filename
                }
                
            except Exception as e:
                logger.error(f"[C1] Follow-up generation failed for {pose_label}: {str(e)}")
                return {"pose": pose_label, "success": False, "error": str(e)}
        
        # Generate follow-up poses concurrently
        followup_tasks = [asyncio.create_task(_gen_followup_pose(pose)) for pose in poses[1:]]
        followup_results = await asyncio.gather(*followup_tasks, return_exceptions=False)
        results.extend(followup_results)
        
        logger.info(f"[C1] Generation completed. Generated {len(results)} images")
        
        return {
            "results": results,
            "consistency_token": token,
            "recipe": recipe,
            "garment_type": garment_type,
            "total_poses": len(poses),
            "successful_poses": len([r for r in results if r.get("success", False)])
        }
        
    except Exception as e:
        logger.error(f"[C1] Generation failed: {str(e)}")
        raise RuntimeError(f"C1 shotpack generation failed: {str(e)}")

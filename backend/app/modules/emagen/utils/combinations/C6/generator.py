"""
C6 Generation Engine: Fashion + Product on Human + Identity Preset
================================================================

Async generation engine for C6 combination with face swap verification.
Combines C3's human product display with C4's identity preset generation.
"""

import os, json, io, asyncio, hashlib, logging, uuid, time
import json as jsonlib
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageFilter, ImageDraw

from ...data import select_poses, get_recipe_style
from ...house_model_api import HouseModelSpec, house_model_api
from ...image_comparison_utils import image_comparison_api
from ...storage_utils import storage_manager
from .prompt_builder import (
    build_c6_face_swap_payload, build_c6_shotpack_payload, 
    get_c6_system_instruction, get_c6_face_swap_system_instruction,
    PHOTOREALISM_CHARTER
)

logger = logging.getLogger(__name__)

# ---------- C6 Generation Configuration ----------
C6_MODEL_NAME = "gemini-2.5-flash-image-preview"
C6_GEN_CFG = {"temperature": 0.0, "top_p": 0.0, "top_k": 1}

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

# ---------- Image Comparison Helpers ----------
def _verify_face_swap_quality(original_product: bytes, face_swap_result: bytes, identity_bytes: bytes) -> Dict[str, Any]:
    """
    Verify the quality of face swap using image comparison
    
    Args:
        original_product: Original product image bytes
        face_swap_result: Face swap result bytes
        identity_bytes: Identity image bytes
        
    Returns:
        Dict with verification results
    """
    try:
        logger.info("[C6] Verifying face swap quality")
        
        # Compare face swap result with original product (should be similar scene, different face)
        comparison_result = image_comparison_api.compare_images(
            image1_data=original_product,
            image2_data=face_swap_result,
            save_images=False
        )
        
        if not comparison_result['success']:
            logger.warning("[C6] Face swap verification failed")
            return {
                'verified': False,
                'reason': 'Image comparison failed',
                'details': comparison_result.get('error', 'Unknown error')
            }
        
        comparison_data = comparison_result['data']
        
        # Check if scene is similar but identity is different (good face swap)
        scene_similar = comparison_data.get('scene_same', False)
        identity_different = not comparison_data.get('identity_same', True)
        
        # Face swap is good if:
        # 1. Scene is similar (same pose, background, garment)
        # 2. Identity is different (face was successfully swapped)
        face_swap_good = scene_similar and identity_different
        
        logger.info(f"[C6] Face swap verification: scene_similar={scene_similar}, identity_different={identity_different}, good={face_swap_good}")
        
        return {
            'verified': face_swap_good,
            'scene_similar': scene_similar,
            'identity_different': identity_different,
            'ssim_score': comparison_data.get('ssim_score', 0),
            'face_similarity': comparison_data.get('face_similarity_score'),
            'reason': comparison_data.get('reason', 'Unknown'),
            'details': comparison_data
        }
        
    except Exception as e:
        logger.error(f"[C6] Face swap verification error: {str(e)}")
        return {
            'verified': False,
            'reason': f'Verification error: {str(e)}',
            'details': None
        }

# ---------- Content Builders ----------
def _make_c6_face_swap_contents(*, product_bytes: bytes, identity_face_bytes: bytes, 
                               json_payload: dict) -> List[Any]:
    """Build contents for C6 face swap generation: product + identity face"""
    from google.genai import types as gatypes
    
    images_order = {
        "product_reference": "first_image",
        "identity_face": "second_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    # Determine mime type based on image header
    mime_type = "image/png" if identity_face_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    
    return [
        jtxt,
        gatypes.Part.from_bytes(mime_type="image/jpeg", data=product_bytes),
        gatypes.Part.from_bytes(mime_type=mime_type, data=identity_face_bytes)
    ]

def _make_c6_shotpack_contents(*, product_bytes: bytes, anchor_png_full: bytes, 
                              anchor_png_face: Optional[bytes], json_payload: dict) -> List[Any]:
    """Build contents for C6 shotpack generation: product + anchor + optional face"""
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
async def _gen_c6_image_in_thread(*, contents: List[Any], is_face_swap: bool = False) -> Any:
    """
    Run a single generate_content call for C6 in a worker thread
    """
    # Choose system instruction based on whether this is face swap or shotpack
    if is_face_swap:
        sysinst = get_c6_face_swap_system_instruction()
        logger.info(f"[C6][FACE_SWAP] System instruction length: {len(sysinst)}")
    else:
        sysinst = get_c6_system_instruction()
        logger.info(f"[C6][SHOTPACK] System instruction length: {len(sysinst)}")

    loop = asyncio.get_running_loop()
    
    def _worker():
        # Use new SDK for generation
        try:
            from google import genai as new_genai
            from google.genai import types as gatypes
            
            client = new_genai.Client()
            
            # Build config with system instruction
            gen_cfg = gatypes.GenerateContentConfig(
                temperature=C6_GEN_CFG.get("temperature", 0.0),
                top_p=C6_GEN_CFG.get("top_p", 0.0),
                top_k=C6_GEN_CFG.get("top_k", 1),
                system_instruction=sysinst,
                response_modalities=["IMAGE"]
            )
            
            mode = "FACE_SWAP" if is_face_swap else "SHOTPACK"
            logger.info(f"[C6][NEW_SDK][{mode}] Using new SDK for generation")
            
            resp = client.models.generate_content(
                model=C6_MODEL_NAME,
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
            logger.error(f"[C6][NEW_SDK][{mode}] Generation failed: {e}")
            raise
    
    resp = await loop.run_in_executor(None, _worker)
    return resp

# ---------- Main Generation Function ----------
async def generate_c6_shotpack(*, recipe: str, garment_type: str, product_bytes: bytes, 
                              identity_preset: Dict[str, str]) -> Dict[str, Any]:
    """
    Generate C6 shotpack: Fashion + Product on Human + Identity Preset
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean', 'street-style')
        garment_type: Type of garment (e.g., 'top', 'dress', 'bottom')
        product_bytes: Product on human image as bytes
        identity_preset: Identity preset specification as dict
        
    Returns:
        Dict containing results with image URLs and metadata
    """
    try:
        # Convert dict to HouseModelSpec
        spec = HouseModelSpec(**identity_preset)
        
        # Generate consistency token
        token = uuid.uuid4().hex[:12]
        logger.info(f"[C6] Starting generation with token: {token}")
        
        # Generate identity from preset first
        logger.info(f"[C6] Generating identity from preset: {spec.to_dict()}")
        identity_result = await house_model_api.generate_model_angle(spec, "front", C6_MODEL_NAME)
        
        if not identity_result["success"]:
            raise RuntimeError(f"Failed to generate identity: {identity_result.get('error', 'Unknown error')}")
        
        identity_bytes = identity_result["image_bytes"]
        logger.info(f"[C6] Generated identity image: {len(identity_bytes)} bytes")
        
        # Create face crop for face swap
        identity_face_bytes = _face_crop_from_png(identity_bytes)
        
        # Get poses for the recipe and garment type
        poses = select_poses(recipe, garment_type)
        logger.info(f"[C6] Selected poses: {poses}")
        
        results: List[Dict[str, Any]] = []
        
        # ---------- Face Swap Generation ----------
        logger.info(f"[C6] Performing face swap on product image")
        
        # Build face swap payload
        face_swap_payload = build_c6_face_swap_payload(
            recipe=recipe,
            garment_type=garment_type,
            pose_label=poses[0],  # Use first pose for face swap
            consistency_token=token
        )
        
        # Build face swap contents
        face_swap_contents = _make_c6_face_swap_contents(
            product_bytes=product_bytes,
            identity_face_bytes=identity_face_bytes,
            json_payload=face_swap_payload
        )
        
        # Generate face swap image
        face_swap_resp = await _gen_c6_image_in_thread(contents=face_swap_contents, is_face_swap=True)
        face_swap_png, face_swap_jpeg = _first_image_bytes_from_resp(face_swap_resp)
        
        if not face_swap_png or not face_swap_jpeg:
            raise RuntimeError("No image generated for face swap")
        
        logger.info(f"[C6] Face swap completed")
        
        # Verify face swap quality
        verification_result = _verify_face_swap_quality(
            original_product=product_bytes,
            face_swap_result=face_swap_jpeg,
            identity_bytes=identity_bytes
        )
        
        if not verification_result['verified']:
            logger.warning(f"[C6] Face swap verification failed: {verification_result['reason']}")
            # Continue with generation but log the issue
        else:
            logger.info(f"[C6] Face swap verified successfully: {verification_result['reason']}")
        
        # ---------- Anchor Generation (First Pose) ----------
        first_pose = poses[0]
        logger.info(f"[C6] Generating anchor pose: {first_pose}")
        
        # Build anchor payload
        anchor_payload = build_c6_shotpack_payload(
            recipe=recipe,
            garment_type=garment_type,
            pose_label=first_pose,
            consistency_token=token
        )
        
        # Build anchor contents
        anchor_contents = _make_c6_shotpack_contents(
            product_bytes=product_bytes,
            anchor_png_full=face_swap_png,
            anchor_png_face=identity_face_bytes,
            json_payload=anchor_payload
        )
        
        # Generate anchor image
        anchor_resp = await _gen_c6_image_in_thread(contents=anchor_contents, is_face_swap=False)
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
        
        logger.info(f"[C6] Anchor generated: {anchor_filename}")
        
        # Prepare identity references for follow-ups
        identity_full_bytes = anchor_png  # Use PNG for identity pass-through
        
        # ---------- Follow-up Generation (Poses 2-4) ----------
        async def _gen_followup_pose(pose_label: str):
            """Generate a single follow-up pose"""
            try:
                logger.info(f"[C6] Generating follow-up pose: {pose_label}")
                
                # Build follow-up payload
                followup_payload = build_c6_shotpack_payload(
                    recipe=recipe,
                    garment_type=garment_type,
                    pose_label=pose_label,
                    consistency_token=token
                )
                
                # Build follow-up contents
                followup_contents = _make_c6_shotpack_contents(
                    product_bytes=product_bytes,
                    anchor_png_full=identity_full_bytes,
                    anchor_png_face=identity_face_bytes,
                    json_payload=followup_payload
                )
                
                # Generate follow-up image
                followup_resp = await _gen_c6_image_in_thread(contents=followup_contents, is_face_swap=False)
                followup_png, followup_jpeg = _first_image_bytes_from_resp(followup_resp)
                
                if not followup_jpeg:
                    return {"pose": pose_label, "success": False, "error": "No image generated"}
                
                # Save follow-up image
                followup_filename = f"shotpack_{recipe}_{pose_label}_{token}.jpg"
                followup_url = _save_bytes_to_storage(followup_jpeg, followup_filename)
                
                logger.info(f"[C6] Follow-up generated: {followup_filename}")
                return {
                    "pose": pose_label,
                    "success": True,
                    "image_url": followup_url,
                    "filename": followup_filename
                }
                
            except Exception as e:
                logger.error(f"[C6] Follow-up generation failed for {pose_label}: {str(e)}")
                return {"pose": pose_label, "success": False, "error": str(e)}
        
        # Generate follow-up poses concurrently
        followup_tasks = [asyncio.create_task(_gen_followup_pose(pose)) for pose in poses[1:]]
        followup_results = await asyncio.gather(*followup_tasks, return_exceptions=False)
        results.extend(followup_results)
        
        logger.info(f"[C6] Generation completed. Generated {len(results)} images")
        
        return {
            "results": results,
            "consistency_token": token,
            "recipe": recipe,
            "garment_type": garment_type,
            "identity_preset": spec.to_dict(),
            "face_swap_verification": verification_result,
            "total_poses": len(poses),
            "successful_poses": len([r for r in results if r.get("success", False)])
        }
        
    except Exception as e:
        logger.error(f"[C6] Generation failed: {str(e)}")
        raise RuntimeError(f"C6 shotpack generation failed: {str(e)}")

"""
C3 Generation Engine: Fashion + Product on human + Identity uploaded
==================================================================

Async generation engine for C3 combination with face swap approach.
Simplified implementation focusing on core functionality.
"""

import os, json, io, asyncio, hashlib, logging, uuid, time
import json as jsonlib
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageFilter, ImageDraw
import google.generativeai as genai

from ...data import select_poses, get_recipe_style
from ...image_comparison_utils import image_comparison_api
from .prompt_builder import (
    build_c3_face_swap_payload, build_c3_shotpack_payload, get_c3_system_instruction,
    PHOTOREALISM_CHARTER
)

logger = logging.getLogger(__name__)

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
    """Convert payload to JSON string for sending"""
    return json.dumps(payload, separators=(",", ":"))

def _ensure_io_contract(payload: dict, images_order: dict) -> dict:
    """Ensure io_contract is present in payload"""
    if "io_contract" not in payload:
        payload["io_contract"] = {}
    payload["io_contract"]["images_order"] = images_order
    return payload

def _assert_io_contract_present(jtxt: str) -> None:
    """Assert that io_contract is present in JSON"""
    if "io_contract" not in jtxt:
        raise ValueError("io_contract missing from payload")

# ---------- Storage Helper ----------
def _save_bytes_to_storage(bytes_data: bytes, filename: str) -> str:
    """Save bytes to storage and return the URL"""
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

def make_center_face_crop(identity_bytes: bytes, target_size: int = 384) -> bytes:
    """Helper to create center face crop from identity bytes, resize to target_size on short side"""
    try:
        im = Image.open(io.BytesIO(identity_bytes)).convert("RGB")
        w, h = im.size
        
        # Simple square center-crop with padding
        side = int(min(w, h) * 0.7)
        cx, cy = w // 2, int(h * 0.42)  # bias up for hairline
        x0, y0 = max(0, cx - side // 2), max(0, cy - side // 2)
        x1, y1 = min(w, x0 + side), min(h, y0 + side)
        tight = im.crop((x0, y0, x1, y1))
        
        # Resize to target_size on short side
        short_side = min(tight.size)
        if short_side > target_size:
            scale = target_size / short_side
            new_w = int(tight.size[0] * scale)
            new_h = int(tight.size[1] * scale)
            tight = tight.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        buf = io.BytesIO()
        tight.save(buf, format="JPEG", quality=95, optimize=True)
        return buf.getvalue()
    except Exception as e:
        logger.error(f"[FACE_CROP] Error creating face crop: {e}")
        return identity_bytes  # fallback to original

# ---------- Content Builders ----------
def _make_c3_face_swap_contents(*, product_bytes: bytes, identity_bytes: bytes, 
                               identity_face_crop: bytes, json_payload: dict) -> List[Any]:
    """Build contents for C3 face swap generation"""
    from google.genai import types as gatypes
    
    # Set mime types
    product_mime = "image/png" if product_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    identity_mime = "image/png" if identity_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    face_crop_mime = "image/jpeg"
    
    # Build images_order
    images_order = {
        "product_reference": "first_image",
        "identity_source": "second_image", 
        "identity_face_crop": "third_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    contents = [
        jtxt,
        gatypes.Part.from_bytes(mime_type=product_mime, data=product_bytes),
        gatypes.Part.from_bytes(mime_type=identity_mime, data=identity_bytes),
        gatypes.Part.from_bytes(mime_type=face_crop_mime, data=identity_face_crop)
    ]
    
    return contents

def _make_c3_anchor_contents(*, face_swap_bytes: bytes, identity_bytes: bytes, 
                            identity_face_crop: bytes, json_payload: dict) -> List[Any]:
    """Build contents for C3 anchor generation (recipe change only)"""
    from google.genai import types as gatypes
    
    # Set mime types
    base_mime = "image/png" if face_swap_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    identity_mime = "image/png" if identity_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    face_crop_mime = "image/jpeg"
    
    # Build images_order for anchor generation
    images_order = {
        "base_image": "first_image",  # Face swap result or original product
        "identity_source": "second_image", 
        "identity_face_crop": "third_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    contents = [
        jtxt,
        gatypes.Part.from_bytes(mime_type=base_mime, data=face_swap_bytes),
        gatypes.Part.from_bytes(mime_type=identity_mime, data=identity_bytes),
        gatypes.Part.from_bytes(mime_type=face_crop_mime, data=identity_face_crop)
    ]
    
    return contents

def _make_c3_followup_contents(*, base_image_bytes: bytes, anchor_bytes: bytes,
                              json_payload: dict) -> List[Any]:
    """Build contents for C3 follow-up generation"""
    from google.genai import types as gatypes
    
    # Set mime types
    base_mime = "image/png" if base_image_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    anchor_mime = "image/png" if anchor_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    
    # Build images_order for follow-up generation
    images_order = {
        "base_image": "first_image",
        "anchor_reference": "second_image"
    }
    
    merged = _ensure_io_contract(json_payload, images_order)
    jtxt = _json_bytes_for_send(merged)
    _assert_io_contract_present(jtxt)
    
    contents = [
        jtxt,
        gatypes.Part.from_bytes(mime_type=base_mime, data=base_image_bytes),
        gatypes.Part.from_bytes(mime_type=anchor_mime, data=anchor_bytes)
    ]
    
    return contents

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
        logger.info("[C3] Verifying face swap quality")
        
        # Compare face swap result with original product (should be similar scene, different face)
        comparison_result = image_comparison_api.compare_images(
            image1_data=original_product,
            image2_data=face_swap_result,
            save_images=False
        )
        
        if not comparison_result['success']:
            logger.warning("[C3] Face swap verification failed")
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
        
        logger.info(f"[C3] Face swap verification: scene_similar={scene_similar}, identity_different={identity_different}, good={face_swap_good}")
        
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
        logger.error(f"[C3] Face swap verification error: {str(e)}")
        return {
            'verified': False,
            'reason': f'Verification error: {str(e)}',
            'details': None
        }

# ---------- Image Processing Helpers ----------
def _first_image_bytes_from_resp(resp) -> Tuple[bytes, bytes]:
    """Extract first image from Gemini response as PNG and JPEG bytes"""
    try:
        if hasattr(resp, 'candidates') and resp.candidates:
            candidate = resp.candidates[0]
            if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts') and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        if hasattr(part.inline_data, 'data') and part.inline_data.data:
                            png_bytes = part.inline_data.data
                            
                            # Convert PNG to JPEG
                            img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
                            jpeg_out = io.BytesIO()
                            img.save(jpeg_out, format="JPEG", quality=95)
                            jpeg_bytes = jpeg_out.getvalue()
                            
                            return png_bytes, jpeg_bytes
        
        raise RuntimeError("No image found in response")
    except Exception as e:
        logger.error(f"Failed to extract image from response: {e}")
        raise RuntimeError(f"Image extraction failed: {str(e)}")

# ---------- Main Generation Function ----------
async def generate_c3_shotpack(recipe: str, garment_type: str, 
                              product_bytes: bytes, identity_bytes: bytes) -> Dict[str, Any]:
    """
    Generate C3 shotpack: Fashion + Product on human + Identity uploaded
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        product_bytes: Product on human image bytes
        identity_bytes: Identity image bytes
        
    Returns:
        Dict containing generation results with S3 URLs
    """
    try:
        logger.info(f"[C3] Starting generation: {recipe} + {garment_type}")
        
        # Get poses for the recipe and garment type
        poses = select_poses(recipe, garment_type)
        if not poses:
            raise ValueError(f"No poses available for recipe '{recipe}' and garment type '{garment_type}'")
        
        # Generate consistency token
        token = str(uuid.uuid4())[:8]
        
        # Initialize Gemini client
        from google import genai as new_genai
        from google.genai import types as gatypes
        
        client = new_genai.Client()
        
        # Get system instruction
        system_instruction = get_c3_system_instruction()
        
        # Create face crop from identity
        identity_face_crop = make_center_face_crop(identity_bytes)
        
        # ---------- Face Swap Generation (First Step) ----------
        logger.info(f"[C3] Performing face swap")
        
        # Build face swap payload
        face_swap_payload = build_c3_face_swap_payload(
            recipe=recipe,
            garment_type=garment_type,
            consistency_token=token
        )
        
        # Build face swap contents
        face_swap_contents = _make_c3_face_swap_contents(
            product_bytes=product_bytes,
            identity_bytes=identity_bytes,
            identity_face_crop=identity_face_crop,
            json_payload=face_swap_payload
        )
        
        # Generate face swap
        face_swap_resp = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=face_swap_contents,
            config=gatypes.GenerateContentConfig(
                temperature=0.0,
                top_p=0.0,
                top_k=1,
                system_instruction=system_instruction,
                response_modalities=["IMAGE"]
            )
        )
        
        face_swap_png, face_swap_jpeg = _first_image_bytes_from_resp(face_swap_resp)
        
        if not face_swap_png or not face_swap_jpeg:
            raise RuntimeError("No image generated for face swap")
        
        logger.info(f"[C3] Face swap completed")
        
        # Verify face swap quality
        verification_result = _verify_face_swap_quality(
            original_product=product_bytes,
            face_swap_result=face_swap_jpeg,
            identity_bytes=identity_bytes
        )
        
        if not verification_result['verified']:
            logger.warning(f"[C3] Face swap verification failed: {verification_result['reason']}")
            # Continue with generation but log the issue
        else:
            logger.info(f"[C3] Face swap verified successfully: {verification_result['reason']}")
        
        # ---------- Anchor Generation (First Pose) ----------
        first_pose = poses[0]
        logger.info(f"[C3] Generating anchor: {first_pose}")
        
        # Build anchor payload
        anchor_payload = build_c3_shotpack_payload(
            recipe=recipe,
            garment_type=garment_type,
            pose_label=first_pose,
            consistency_token=token
        )
        
        # Build anchor contents
        anchor_contents = _make_c3_anchor_contents(
            face_swap_bytes=face_swap_png,
            identity_bytes=identity_bytes,
            identity_face_crop=identity_face_crop,
            json_payload=anchor_payload
        )
        
        # Generate anchor
        anchor_resp = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=anchor_contents,
            config=gatypes.GenerateContentConfig(
                temperature=0.7,
                top_p=0.9,
                top_k=40,
                system_instruction=system_instruction,
                response_modalities=["IMAGE"]
            )
        )
        
        anchor_png, anchor_jpeg = _first_image_bytes_from_resp(anchor_resp)
        
        if not anchor_png or not anchor_jpeg:
            raise RuntimeError(f"No image generated for anchor pose: {first_pose}")
        
        # Save anchor image
        anchor_filename = f"shotpack_{recipe}_{first_pose}_{token}.jpg"
        anchor_url = _save_bytes_to_storage(anchor_jpeg, anchor_filename)
        results = [{
            "pose": first_pose,
            "success": True,
            "image_url": anchor_url,  # Use S3 URL directly
            "filename": anchor_filename
        }]
        
        logger.info(f"[C3] Anchor generated: {anchor_filename}")
        
        # ---------- Follow-up Generation (Poses 2-4) ----------
        async def _gen_followup_pose(pose_label: str):
            try:
                logger.info(f"[C3] Generating follow-up: {pose_label}")
                
                # Build follow-up payload
                followup_payload = build_c3_shotpack_payload(
                    recipe=recipe,
                    garment_type=garment_type,
                    pose_label=pose_label,
                    consistency_token=token
                )
                
                # Build follow-up contents
                followup_contents = _make_c3_followup_contents(
                    base_image_bytes=face_swap_png,
                    anchor_bytes=anchor_png,
                    json_payload=followup_payload
                )
                
                # Generate follow-up
                followup_resp = client.models.generate_content(
                    model="gemini-2.5-flash-image-preview",
                    contents=followup_contents,
                    config=gatypes.GenerateContentConfig(
                        temperature=0.7,
                        top_p=0.9,
                        top_k=40,
                        system_instruction=system_instruction,
                        response_modalities=["IMAGE"]
                    )
                )
                
                followup_png, followup_jpeg = _first_image_bytes_from_resp(followup_resp)
                
                if not followup_jpeg:
                    return {"pose": pose_label, "success": False, "error": "No image generated"}
                
                # Save follow-up image
                followup_filename = f"shotpack_{recipe}_{pose_label}_{token}.jpg"
                followup_url = _save_bytes_to_storage(followup_jpeg, followup_filename)
                
                logger.info(f"[C3] Follow-up generated: {followup_filename}")
                return {
                    "pose": pose_label,
                    "success": True,
                    "image_url": followup_url,  # Use S3 URL directly
                    "filename": followup_filename
                }
                
            except Exception as e:
                logger.error(f"[C3] Follow-up generation failed for {pose_label}: {str(e)}")
                return {"pose": pose_label, "success": False, "error": str(e)}
        
        # Generate follow-up poses concurrently
        followup_tasks = [asyncio.create_task(_gen_followup_pose(pose)) for pose in poses[1:]]
        followup_results = await asyncio.gather(*followup_tasks, return_exceptions=True)
        
        # Add follow-up results
        for result in followup_results:
            if isinstance(result, dict):
                results.append(result)
            else:
                logger.error(f"[C3] Follow-up task failed: {result}")
        
        logger.info(f"[C3] Generation completed: {len(results)} images")
        
        return {
            "combination": "C3",
            "recipe": recipe,
            "garment_type": garment_type,
            "results": results,
            "metadata": {
                "consistency_token": token,
                "total_images": len(results),
                "successful_images": len([r for r in results if r.get("success", False)])
            }
        }
        
    except Exception as e:
        logger.error(f"[C3] Generation failed: {str(e)}")
        raise RuntimeError(f"C3 shotpack generation failed: {str(e)}")

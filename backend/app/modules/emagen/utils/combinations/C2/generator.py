"""
C2 Generation Engine: Fashion + Product on Mannequin + Uploaded Identity
======================================================================

Async generation engine for C2 combination with anchor-followup pattern.
Adapted from C1 for mannequin product input.
"""

import os, json, io, asyncio, hashlib, logging, uuid, time
import json as jsonlib
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageFilter, ImageDraw
import google.generativeai as genai

from ...data import select_poses, get_recipe_style
from .prompt_builder import (
    build_c2_anchor_payload, build_c2_followup_payload, get_c2_system_instruction,
    PHOTOREALISM_CHARTER
)

logger = logging.getLogger(__name__)

# ---------- G0A Preprocessing Functions ----------
_G0A_SYSINST = (
    "You are a garment CUTOUT engine (not a painter). "
    "Output must be the original garment pixels only, with alpha=0 for all non-garment pixels. "
    "Do NOT draw, blur, pixelate, censor, inpaint, or repaint any region. "
    "If unsure about a pixel, set alpha=0. "
    "Return a PNG with transparency (no checkerboard baked into RGB). "
    "If you cannot extract confidently, return a fully transparent PNG of the same size. "
    "Never return the intact original image."
)

def _g0_alpha_refine(png_bytes: bytes, erode_px: int = 1, dilate_px: int = 1) -> bytes:
    """Fast alpha cleanup: erode small person pixels then dilate to restore edge."""
    try:
        im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        r, g, b, a = im.split()
        if erode_px > 0:
            a = a.filter(ImageFilter.MinFilter(erode_px * 2 + 1))
        if dilate_px > 0:
            a = a.filter(ImageFilter.MaxFilter(dilate_px * 2 + 1))
        im = Image.merge("RGBA", (r, g, b, a))
        out = io.BytesIO()
        im.save(out, format="PNG")
        return out.getvalue()
    except Exception:
        return png_bytes  # fail-open

def _g0_call_gemini(image_bytes: bytes, sysinst: str, payload: dict, image_mime: str) -> bytes:
    """G0A preprocessing using new SDK format."""
    from google import genai as new_genai
    from google.genai import types as gatypes
    
    # Log system instruction and payload
    logger.info(f"[G0-PREPROCESS] System Instruction: {sysinst}")
    logger.info(f"[G0-PREPROCESS] JSON Payload: {json.dumps(payload, indent=2)}")
    logger.info(f"[G0-PREPROCESS] Image MIME: {image_mime}, Size: {len(image_bytes)} bytes")

    client = new_genai.Client()
    
    # Build contents with new SDK format
    contents = [
        json.dumps(payload, separators=(",", ":")),  # JSON payload as string
        gatypes.Part.from_bytes(mime_type=image_mime or "image/jpeg", data=image_bytes),
    ]
    
    # Build config with system instruction
    g0_gen_cfg = gatypes.GenerateContentConfig(
        temperature=0.0,
        top_p=0.0,
        top_k=1,
        system_instruction=sysinst,
        response_modalities=["IMAGE"],  # Image-only response
    )
    
    resp = client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=contents,
        config=g0_gen_cfg,
    )

    # Extract first image part
    if hasattr(resp, 'candidates') and resp.candidates:
        candidate = resp.candidates[0]
        if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts') and candidate.content.parts:
            for part in candidate.content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    if hasattr(part.inline_data, 'data') and part.inline_data.data:
                        return part.inline_data.data
    
    raise RuntimeError("G0: no image returned by Gemini")

def run_g0_mannequin_cutout(image_bytes: bytes, garment_type: str, image_mime: str = "image/jpeg",
                            refine_edges: bool = True) -> bytes:
    """G0A: mannequin → garment-only cutout on transparent background (keep dupatta/scarf)."""
    payload = {
        "version": "v7",
        "product_type": "fashion",
        "mode": "cutout",
        "garment_type": garment_type,
        "intent": "garment_only",
        "directives": {
            "preserve": ["garment_fit", "drape", "seams", "texture", "logos", "accessories"],
            "remove": ["mannequin", "skin", "hair", "face", "background"]
        },
        "quality_contract": {
            "alpha_handling": "clean_edges",
            "preserve_fabric_texture": True,
            "preserve_logos": True
        }
    }
    
    try:
        logger.info(f"[G0A] Starting mannequin cutout for {garment_type}")
        png_bytes = _g0_call_gemini(image_bytes, _G0A_SYSINST, payload, image_mime)
        
        if refine_edges:
            png_bytes = _g0_alpha_refine(png_bytes, erode_px=1, dilate_px=1)
        
        logger.info(f"[G0A] Mannequin cutout completed, size: {len(png_bytes)} bytes")
        return png_bytes
        
    except Exception as e:
        logger.error(f"[G0A] Mannequin cutout failed: {str(e)}")
        raise RuntimeError(f"G0A mannequin cutout failed: {str(e)}")

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

# ---------- Content Builders ----------
def _make_c2_anchor_contents(*, mannequin_product_bytes: bytes, uploaded_identity_bytes: bytes, 
                            json_payload: dict) -> List[Any]:
    """Build contents for C2 anchor generation: mannequin product + uploaded identity"""
    from google.genai import types as gatypes
    
    # First image: garment cutout (G0A result)
    garment_cutout = run_g0_mannequin_cutout(mannequin_product_bytes, json_payload.get("garment_type", "top"))
    
    # Second image: identity face crop
    identity_face_crop = _face_crop_from_png(uploaded_identity_bytes)
    
    # Third image: composition canvas (optional)
    composition_canvas = _create_composition_canvas(json_payload)
    
    return [
        json.dumps(json_payload, separators=(",", ":")),
        gatypes.Part.from_bytes(mime_type="image/png", data=garment_cutout),
        gatypes.Part.from_bytes(mime_type="image/png", data=identity_face_crop),
        gatypes.Part.from_bytes(mime_type="image/png", data=composition_canvas)
    ]

def _make_c2_followup_contents(*, garment_cutout_bytes: bytes, anchor_full_bytes: bytes,
                              json_payload: dict) -> List[Any]:
    """Build contents for C2 follow-up generation"""
    from google.genai import types as gatypes
    
    return [
        json.dumps(json_payload, separators=(",", ":")),
        gatypes.Part.from_bytes(mime_type="image/png", data=garment_cutout_bytes),
        gatypes.Part.from_bytes(mime_type="image/png", data=anchor_full_bytes)
    ]

def _face_crop_from_png(png_bytes: bytes) -> bytes:
    """Extract face crop from identity image"""
    try:
        img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
        # Simple center crop for face region
        w, h = img.size
        face_size = min(w, h) // 2
        left = (w - face_size) // 2
        top = (h - face_size) // 4  # Face is typically in upper portion
        right = left + face_size
        bottom = top + face_size
        
        face_crop = img.crop((left, top, right, bottom))
        out = io.BytesIO()
        face_crop.save(out, format="PNG")
        return out.getvalue()
    except Exception as e:
        logger.warning(f"Face crop failed: {e}, using original")
        return png_bytes

def _create_composition_canvas(json_payload: dict) -> bytes:
    """Create composition canvas for guidance"""
    try:
        # Create a simple canvas based on pose requirements
        canvas = Image.new("RGB", (1024, 1024), (240, 240, 240))
        draw = ImageDraw.Draw(canvas)
        
        # Add pose guidance lines
        pose_label = json_payload.get("pose", {}).get("label", "front_full")
        if "front" in pose_label:
            # Front pose guidance
            draw.line([(512, 100), (512, 900)], fill=(200, 200, 200), width=2)
        elif "side" in pose_label:
            # Side pose guidance
            draw.line([(200, 200), (800, 800)], fill=(200, 200, 200), width=2)
        
        out = io.BytesIO()
        canvas.save(out, format="PNG")
        return out.getvalue()
    except Exception:
        # Return a simple white canvas if creation fails
        canvas = Image.new("RGB", (1024, 1024), (255, 255, 255))
        out = io.BytesIO()
        canvas.save(out, format="PNG")
        return out.getvalue()

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
async def generate_c2_shotpack(recipe: str, garment_type: str, 
                              mannequin_product_bytes: bytes, identity_bytes: bytes) -> Dict[str, Any]:
    """
    Generate C2 shotpack: Fashion + Product on Mannequin + Uploaded Identity
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        mannequin_product_bytes: Product on mannequin image bytes
        identity_bytes: Identity image bytes
        
    Returns:
        Dict containing generation results with S3 URLs
    """
    try:
        logger.info(f"[C2] Starting generation: {recipe} + {garment_type}")
        
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
        system_instruction = get_c2_system_instruction()
        
        # ---------- Anchor Generation (First Pose) ----------
        first_pose = poses[0]
        logger.info(f"[C2] Generating anchor: {first_pose}")
        
        # Build anchor payload
        anchor_payload = build_c2_anchor_payload(
            recipe=recipe,
            garment_type=garment_type,
            pose_label=first_pose,
            consistency_token=token
        )
        
        # Build anchor contents
        anchor_contents = _make_c2_anchor_contents(
            mannequin_product_bytes=mannequin_product_bytes,
            uploaded_identity_bytes=identity_bytes,
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
        
        logger.info(f"[C2] Anchor generated: {anchor_filename}")
        
        # Prepare identity references for follow-ups
        identity_full_bytes = anchor_png  # Use PNG for identity pass-through
        identity_face_bytes = _face_crop_from_png(identity_full_bytes)  # Optional face crop
        
        # ---------- Follow-up Generation (Poses 2-4) ----------
        async def _gen_followup_pose(pose_label: str):
            try:
                logger.info(f"[C2] Generating follow-up: {pose_label}")
                
                # Build follow-up payload
                followup_payload = build_c2_followup_payload(
                    recipe=recipe,
                    garment_type=garment_type,
                    pose_label=pose_label,
                    consistency_token=token
                )
                
                # Build follow-up contents
                followup_contents = _make_c2_followup_contents(
                    garment_cutout_bytes=run_g0_mannequin_cutout(mannequin_product_bytes, garment_type),
                    anchor_full_bytes=anchor_png,
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
                
                logger.info(f"[C2] Follow-up generated: {followup_filename}")
                return {
                    "pose": pose_label,
                    "success": True,
                    "image_url": followup_url,  # Use S3 URL directly
                    "filename": followup_filename
                }
                
            except Exception as e:
                logger.error(f"[C2] Follow-up generation failed for {pose_label}: {str(e)}")
                return {"pose": pose_label, "success": False, "error": str(e)}
        
        # Generate follow-up poses concurrently
        followup_tasks = [asyncio.create_task(_gen_followup_pose(pose)) for pose in poses[1:]]
        followup_results = await asyncio.gather(*followup_tasks, return_exceptions=True)
        
        # Add follow-up results
        for result in followup_results:
            if isinstance(result, dict):
                results.append(result)
            else:
                logger.error(f"[C2] Follow-up task failed: {result}")
        
        logger.info(f"[C2] Generation completed: {len(results)} images")
        
        return {
            "combination": "C2",
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
        logger.error(f"[C2] Generation failed: {str(e)}")
        raise RuntimeError(f"C2 shotpack generation failed: {str(e)}")

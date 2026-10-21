"""
C3 Prompt Builder: Fashion + Product on human + Identity uploaded
================================================================

Builds prompts specifically for C3 combination:
- Product Type: Fashion/Garment
- Input Image Type: Product on human
- Identity Type: Uploaded (face swap approach)

Uses centralized data from emagen_utils.data module.
"""

import logging
from typing import Optional, Dict, Any

from ...data import (
    RECIPE_POSE_SETS, POSE_ATOMS,
    get_pose_rule, get_pose_negatives, get_pose_directives, get_pose_contrast_policy, get_detail_crop_policy
)

logger = logging.getLogger(__name__)

# ---------- Shared Helper Functions ----------
def _build_pose_data(pose_label: str) -> dict:
    """Build pose data structure with rules, directives, and negatives"""
    pose_rule = get_pose_rule(pose_label)
    pose_negatives = get_pose_negatives(pose_label)
    pose_directives = get_pose_directives(pose_label)
    
    pose_data = {
        "label": pose_label,
        "rules": pose_rule,
        "directives": pose_directives,
        "negatives": pose_negatives,
    }
    
    # Add composition override if available
    pose_atom = POSE_ATOMS.get(pose_label, {})
    composition_override = pose_atom.get("composition_override", {})
    if composition_override:
        pose_data["composition_override"] = composition_override
    
    return pose_data

def _build_quality_contract() -> dict:
    """Build shared quality contract for photorealism"""
    return {
        "optics": {
            "lens_mm": [50, 85],
            "aperture": "f/2.8–f/5.6",
            "dof": "subject fully sharp; background bokeh as recipe",
            "camera_height_rule": "respect pose.camera_height"
        },
        "lighting": {
            "key": "direction per recipe (sun/softbox/window)",
            "fill_ratio": "1:2–1:3",
            "shadow_rules": "single shadow, correct length, crisp contact under feet/hem"
        },
        "materials": {
            "skin_texture": "natural pores; no plastic/airbrush",
            "fabric_microtexture": "show weave, seams, stitching; no smearing"
        },
        "color_tone": {
            "white_balance": "per recipe (e.g., 5200–6500K daylight unless specified)",
            "contrast": "filmic; avoid HDR halos/over-sharpen"
        },
        "negatives_semantic": [
            "cgi look", "double shadows", "waxy skin", "over-smoothing",
            "warped logos", "non-physical reflections"
        ]
    }

def validate_c3_parameters(recipe: str, garment_type: str, pose: str) -> Optional[str]:
    """
    Validate C3-specific parameters
    
    Args:
        recipe: Recipe style to validate
        garment_type: Garment type to validate  
        pose: Pose to validate
        
    Returns:
        Error message if validation fails, None if valid
    """
    # Validate recipe
    if recipe not in RECIPE_POSE_SETS:
        valid_recipes = ", ".join(RECIPE_POSE_SETS.keys())
        return f"Invalid recipe '{recipe}'. Valid recipes: {valid_recipes}"
    
    # Validate garment_type for the recipe
    if garment_type not in RECIPE_POSE_SETS[recipe]:
        valid_garments = ", ".join(RECIPE_POSE_SETS[recipe].keys())
        return f"Invalid garment_type '{garment_type}' for recipe '{recipe}'. Valid types: {valid_garments}"
    
    # Validate pose
    if pose not in POSE_ATOMS:
        valid_poses = ", ".join(POSE_ATOMS.keys())
        return f"Invalid pose '{pose}'. Valid poses: {valid_poses}"
    
    return None

# ---------- C3 System Instructions ----------
PHOTOREALISM_CHARTER = (
    "\n\nPhotorealism Charter\n"
    "Generate photography, not illustration. Enforce physical plausibility.\n"
    "Optics: emulate a real lens (35–85 mm portrait range unless recipe overrides); natural geometric distortion; verticals upright unless specified; depth of field consistent with f/2.8–f/5.6 (subject fully sharp, background bokeh if called for).\n"
    "Lighting: single primary key light consistent with environment (sun, softbox, or window); coherent shadow direction; grounded contact shadows under feet/hem; no double shadows; speculars on fabric/skin are soft and realistic.\n"
    "Materials & skin: retain micro-texture (fabric weave, stitching, pores, flyaway hairs). Avoid plastic/waxy skin, over-smoothing, or halo sharpening.\n"
    "Color & tone: accurate white balance per recipe; filmic contrast; no oversaturation or HDR bloom unless recipe requests it.\n"
    "Anatomy & geometry QA: correct limb/finger count; natural joint bends; no fused accessories; hemlines level unless wind specified.\n"
    "Semantic negatives: avoid CGI look, painterly brushwork, plastic skin, flat ambient light, duplicate shadows, warped logos, inconsistent sun.\n"
    "Priority order: identity fidelity → product fidelity (drape, cut, texture, logos) → recipe style → pose change (when requested)."
)

C3_SYSTEM_INSTRUCTION = (
    "You are a professional face swap specialist for ecommerce photography.\n\n"
    "PRIMARY TASK: Replace ONLY the model's face with the identity face while preserving everything else.\n\n"
    "CRITICAL REQUIREMENTS:\n"
    "- Replace ONLY the face region (eyes, nose, mouth, cheeks, chin, jawline)\n"
    "- Preserve hairline, hair color/style, garment, pose, background, lighting\n"
    "- Match skin tone, lighting direction, and facial expression exactly\n"
    "- Ensure seamless blending with no visible seams, artifacts, or color mismatches\n"
    "- Maintain the exact same perspective, camera angle, and composition\n\n"
    "QUALITY STANDARDS:\n"
    "- Photorealistic result with natural skin texture and pores\n"
    "- Consistent lighting, shadows, and reflections\n"
    "- No pixelation, blur, distortion, or artificial-looking results\n"
    "- Professional ecommerce catalog quality\n"
    "- Natural facial features that match the identity\n\n"
    "TECHNICAL SPECIFICATIONS:\n"
    "- Use the identity face crop as your exact reference\n"
    "- Blend edges seamlessly with the original skin\n"
    "- Maintain original image resolution and clarity\n"
    "- Preserve all garment details, textures, and fit\n\n"
    "If the face swap cannot be performed to professional standards, return a failure message.\n\n"
    "Negatives: generic face, different person, blank face, censored head, pixelated head, visible seams, artificial skin, color mismatch." + PHOTOREALISM_CHARTER
)

def get_c3_system_instruction() -> str:
    """Get the C3-specific system instruction"""
    return C3_SYSTEM_INSTRUCTION

# ---------- C3 Payload JSON Builders ----------
def build_c3_face_swap_payload(*, recipe: str, garment_type: str, 
                              consistency_token: str) -> dict:
    """
    Build face swap JSON payload for C3 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        consistency_token: Token for consistency across operations
        
    Returns:
        Dict containing the face swap payload for C3 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    quality_contract = _build_quality_contract()
    
    return {
        "version": "v1",
        "product_type": "fashion",
        "mode": "face_swap_only",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "garment_type": garment_type,
        "intent": "face_swap_g0b",
        "directives": {
            "preserve": ["garment_fit", "body_proportions", "pose", "background", "lighting"],
            "replace": ["face", "head", "hair", "neck_region"],
            "prohibit": ["beautification", "face_slimming", "age_change", "garment_modification"]
        },
        "locks": {
            "consistency_token": consistency_token,
            "lock_garment": True,
            "lock_pose": True,
            "lock_background": True
        },
        "io_contract": {
            "images_order": {
                "product_reference": "first_image",
                "identity_source": "second_image", 
                "identity_face_crop": "third_image"
            }
        },
        "quality_contract": quality_contract,
    }

def build_c3_shotpack_payload(*, recipe: str, garment_type: str, pose_label: str,
                             consistency_token: str) -> dict:
    """
    Build shotpack JSON payload for C3 combination (fallback mode)
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        pose_label: Pose label (e.g., 'front_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the shotpack payload for C3 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    pose_data = _build_pose_data(pose_label)
    quality_contract = _build_quality_contract()
    
    return {
        "version": "v1",
        "product_type": "fashion",
        "mode": "shotpack_generation",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "garment_type": garment_type,
        "pose": pose_data,
        "intent": "shotpack_fallback",
        "directives": {
            "preserve": ["model_identity", "garment_fit", "background_style"],
            "change_only": ["pose", "recipe_style"]
        },
        "locks": {
            "consistency_token": consistency_token,
            "lock_model_identity": True,
            "lock_garment": True
        },
        "io_contract": {
            "images_order": {
                "product_reference": "first_image",
                "model_reference": "second_image"
            }
        },
        "quality_contract": quality_contract
    }

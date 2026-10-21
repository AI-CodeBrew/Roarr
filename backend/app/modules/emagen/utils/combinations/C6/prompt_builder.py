"""
C6 Prompt Builder: Fashion + Product on Human + Identity Preset
==============================================================

Builds prompts specifically for C6 combination:
- Product Type: Fashion/Garment
- Input Image Type: Product on human (requires face swap)
- Identity Type: Generated from preset specifications

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

def validate_c6_parameters(recipe: str, garment_type: str, pose: str) -> Optional[str]:
    """
    Validate C6-specific parameters
    
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

# ---------- C6 System Instructions ----------
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

C6_FACE_SWAP_SYSTEM_INSTRUCTION = (
    "You are a professional fashion photographer specializing in identity transfer.\n"
    "Your task is to perform a precise face swap while maintaining all other elements exactly.\n"
    "Priority hierarchy:\n"
    "1. Preserve the original model's pose, body proportions, and garment fit exactly.\n"
    "2. Replace only the face with the provided identity face.\n"
    "3. Maintain lighting, background, and composition exactly as in the original.\n"
    "Hard constraints: Only swap the face region; preserve everything else pixel-perfect.\n"
    "Prohibitions: No pose changes, no body modifications, no background alterations." + PHOTOREALISM_CHARTER
)

C6_SYSTEM_INSTRUCTION = (
    "You are a fashion catalog renderer specializing in human product display.\n"
    "Priority hierarchy:\n"
    "1. Preserve generated identity exactly (face, hair, skin tone, body proportions).\n"
    "2. Maintain garment fidelity (drape, cut, texture) from the human reference.\n"
    "3. Apply studio composition and lighting if #1 and #2 are intact.\n"
    "Hard constraints: Use human reference for pose and garment fit; overlay identity face.\n"
    "Prohibitions: No beautification, no age change, no face slimming." + PHOTOREALISM_CHARTER
)

def get_c6_system_instruction() -> str:
    """Get the C6-specific system instruction"""
    return C6_SYSTEM_INSTRUCTION

def get_c6_face_swap_system_instruction() -> str:
    """Get the C6 face swap system instruction"""
    return C6_FACE_SWAP_SYSTEM_INSTRUCTION

# ---------- C6 Payload JSON Builders ----------
def build_c6_face_swap_payload(*, recipe: str, garment_type: str, pose_label: str, 
                              consistency_token: str) -> dict:
    """
    Build face swap JSON payload for C6 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        pose_label: Pose label (e.g., 'front_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the face swap payload for C6 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    pose_data = _build_pose_data(pose_label)
    quality_contract = _build_quality_contract()
    
    return {
        "version": "v7",
        "product_type": "fashion",
        "mode": "face_swap",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "garment_type": garment_type,
        "pose": pose_data,
        "intent": "identity_transfer",
        "directives": {
            "preserve": ["pose", "body_proportions", "garment_fit", "lighting", "background", "composition"],
            "change_only": ["face_identity"]
        },
        "locks": {
            "consistency_token": consistency_token,
            "lock_pose": True,
            "lock_garment": True,
            "lock_background": True,
            "lock_lighting": True
        },
        "io_contract": {
            "images_order": {
                "product_reference": "first_image",
                "identity_face": "second_image"
            }
        },
        "quality_contract": quality_contract,
    }

def build_c6_shotpack_payload(*, recipe: str, garment_type: str, pose_label: str, 
                             consistency_token: str) -> dict:
    """
    Build shotpack JSON payload for C6 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        pose_label: Pose label (e.g., 'three_quarter_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the shotpack payload for C6 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    pose_data = _build_pose_data(pose_label)
    quality_contract = _build_quality_contract()
    
    return {
        "version": "v7",
        "product_type": "fashion",
        "mode": "identity",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "garment_type": garment_type,
        "pose": pose_data,
        "intent": "followup_match_anchor",
        "locks": {
            "consistency_token": consistency_token,
            "lock_garment": True,
            "lock_model_identity": True,
            "lock_background_palette": True,
            "lock_background_geometry": False
        },
        "directives": {
            "preserve": ["model_face", "hair", "background_style", "product_fit", "lighting"],
            "change_only": ["pose"]
        },
        "pose_contract": {
            "must_change_from_anchor": True,
            "min_changes": {
                "torso_yaw_delta_deg": 15,
                "camera_orbit_delta_deg": 15,
                "gait_indicator": "one heel down, opposite heel lifted OR step length ≥ 6% of image height"
            },
            "duplication_negatives": "no front_full stance, no square shoulders, no both feet fully parallel and planted"
        },
        "quality_contract": quality_contract
    }

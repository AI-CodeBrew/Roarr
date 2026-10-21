"""
C2 Prompt Builder: Fashion + Product on Mannequin + Uploaded Identity
====================================================================

Builds prompts specifically for C2 combination:
- Product Type: Fashion/Garment
- Input Image Type: Product on Mannequin
- Identity Type: Uploaded (user-provided identity image)

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

def validate_c2_parameters(recipe: str, garment_type: str, pose: str) -> Optional[str]:
    """
    Validate C2-specific parameters
    
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

# ---------- C2 System Instructions ----------
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

C2_SYSTEM_INSTRUCTION = (
    "You are a fashion catalog renderer.\n\n"
    "Must use the uploaded identity image for the face/head; do not synthesize a different person. "
    "Treat identity_face_source as the likeness ground-truth. If you cannot place the identity confidently, do not invent or censor—return a failure instead.\n\n"
    "MANDATE: In the ANCHOR, replace ALL mannequin skin/hair regions with the uploaded human identity. Keep that same human identity in every FOLLOW-UP.\n\n"
    "Replacement scope:\n"
    "- Regions to REPLACE: head, scalp, face, ears, neck, hair; any VISIBLE skin (arms, hands, legs, feet).\n"
    "- Regions to PRESERVE: garment fit/drape, seam topology, neckline geometry, hemline, fabric texture; scene/background per recipe.\n"
    "- Never leave mannequin plastic skin, doll joints, or mannequin hair/wig visible. No neck seam or color mismatch at the join.\n\n"
    "If the anchor shows ANY mannequin skin/hair, or a visible neck seam, ADJUST and re-render until it shows a natural human head/skin and hair matching the identity.\n"
    "Priority: identity fidelity → garment fidelity → recipe style → pose.\n\n"
    "Negatives: generic face, different person, blank neck, censored head, pixelated head." + PHOTOREALISM_CHARTER
)

def get_c2_system_instruction() -> str:
    """Get the C2-specific system instruction"""
    return C2_SYSTEM_INSTRUCTION

# ---------- C2 Payload JSON Builders ----------
def build_c2_anchor_payload(*, recipe: str, garment_type: str, pose_label: str, 
                           consistency_token: str) -> dict:
    """
    Build anchor JSON payload for C2 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        pose_label: Pose label (e.g., 'front_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the anchor payload for C2 generation
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
        "intent": "anchor_drape",
        "directives": {
            "preserve": ["face_geometry", "eye_spacing", "nose_shape", "mouth_shape", "hairline", "hairstyle", "skin_tone"],
            "prohibit": ["beautification", "face_slimming", "age_change"]
        },
        "locks": {
            "consistency_token": consistency_token,
            "lock_garment": True,
            "lock_model_identity": True
        },
        "io_contract": {
            "images_order": {
                "garment_cutout_source": "first_image",  # G0A result
                "identity_face_crop": "second_image",    # Face crop
                "composition_canvas": "third_image"      # Canvas guides
            }
        },
        "quality_contract": quality_contract,
    }

def build_c2_followup_payload(*, recipe: str, garment_type: str, pose_label: str, 
                             consistency_token: str) -> dict:
    """
    Build follow-up JSON payload for C2 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        pose_label: Pose label (e.g., 'three_quarter_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the follow-up payload for C2 generation
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
        "io_contract": {
            "images_order": {
                "garment_cutout_source": "first_image",  # G0A result for consistency
                "anchor_full": "second_image"            # Anchor reference
            }
        },
        "quality_contract": quality_contract
    }

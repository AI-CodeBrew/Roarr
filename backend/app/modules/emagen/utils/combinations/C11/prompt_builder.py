"""
C11 Prompt Builder: Non-Fashion + Product on Mannequin + Identity Form Selected
===============================================================================

Builds prompts specifically for C11 combination:
- Product Type: Non-Fashion/Product
- Input Image Type: Product on mannequin (requires G0A preprocessing)
- Identity Type: Form Selected (house model generation)

Uses centralized data from emagen_utils.data module.
"""

import logging
from typing import Optional, Dict, Any

from ...data import (
    NON_FASHION_RECIPE_POSE_SETS, POSE_ATOMS,
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

def _build_non_fashion_quality_contract() -> dict:
    """Build quality contract for non-fashion product photorealism"""
    return {
        "optics": {
            "lens_mm": [50, 85],
            "aperture": "f/2.8–f/5.6",
            "dof": "product fully sharp; background bokeh as recipe",
            "camera_height_rule": "respect pose.camera_height"
        },
        "lighting": {
            "key": "direction per recipe (sun/softbox/window)",
            "fill_ratio": "1:2–1:3",
            "shadow_rules": "single shadow, correct length, crisp contact under product"
        },
        "materials": {
            "product_texture": "show material details, finishes, textures; no smearing",
            "reflections": "realistic surface reflections based on material"
        },
        "color_tone": {
            "white_balance": "per recipe (e.g., 5200–6500K daylight unless specified)",
            "contrast": "filmic; avoid HDR halos/over-sharpen"
        },
        "negatives_semantic": [
            "cgi look", "double shadows", "over-smoothing",
            "warped logos", "non-physical reflections", "floating products"
        ]
    }

def validate_c11_parameters(recipe: str, product_category: str, pose: str) -> Optional[str]:
    """
    Validate C11-specific parameters
    
    Args:
        recipe: Recipe style to validate
        product_category: Product category to validate  
        pose: Pose to validate
        
    Returns:
        Error message if validation fails, None if valid
    """
    # Validate recipe
    if recipe not in NON_FASHION_RECIPE_POSE_SETS:
        valid_recipes = ", ".join(NON_FASHION_RECIPE_POSE_SETS.keys())
        return f"Invalid recipe '{recipe}'. Valid recipes: {valid_recipes}"
    
    # Validate product_category for the recipe
    if product_category not in NON_FASHION_RECIPE_POSE_SETS[recipe]:
        valid_categories = ", ".join(NON_FASHION_RECIPE_POSE_SETS[recipe].keys())
        return f"Invalid product_category '{product_category}' for recipe '{recipe}'. Valid categories: {valid_categories}"
    
    # Validate pose
    if pose not in POSE_ATOMS:
        valid_poses = ", ".join(POSE_ATOMS.keys())
        return f"Invalid pose '{pose}'. Valid poses: {valid_poses}"
    
    return None

# ---------- C11 System Instructions ----------
NON_FASHION_PHOTOREALISM_CHARTER = (
    "\n\nNon-Fashion Product Photorealism Charter\n"
    "Generate photography, not illustration. Enforce physical plausibility for products.\n"
    "Optics: emulate a real lens (35–85 mm range unless recipe overrides); natural geometric distortion; verticals upright unless specified; depth of field consistent with f/2.8–f/5.6 (product fully sharp, background bokeh if called for).\n"
    "Lighting: single primary key light consistent with environment (sun, softbox, or window); coherent shadow direction; grounded contact shadows under product; no double shadows; realistic surface reflections based on material.\n"
    "Materials & textures: retain micro-texture (surface finishes, material details, logos, text). Avoid over-smoothing, plastic look, or unrealistic reflections.\n"
    "Color & tone: accurate white balance per recipe; filmic contrast; no oversaturation or HDR bloom unless recipe requests it.\n"
    "Product integrity: maintain exact product appearance, logos, text, and proportions. No floating products or unrealistic positioning.\n"
    "Semantic negatives: avoid CGI look, painterly brushwork, flat ambient light, duplicate shadows, warped logos, floating products.\n"
    "Priority order: product fidelity (exact appearance, logos, text) → identity integration → recipe style → pose change (when requested)."
)

C11_SYSTEM_INSTRUCTION = (
    "You are a product photographer specializing in non-fashion product photography with mannequin preprocessing and generated identity integration.\n"
    "Priority hierarchy:\n"
    "1. Preserve generated identity exactly (face, hair, skin tone, body proportions).\n"
    "2. Maintain product fidelity (exact appearance, logos, text, materials) from the product reference.\n"
    "3. Apply studio composition and lighting if #1 and #2 are intact.\n"
    "Hard constraints: Use product reference for exact appearance; integrate generated identity naturally.\n"
    "Prohibitions: No product modifications, no logo changes, no floating products." + NON_FASHION_PHOTOREALISM_CHARTER
)

def get_c11_system_instruction() -> str:
    """Get the C11-specific system instruction"""
    return C11_SYSTEM_INSTRUCTION

# ---------- C11 Payload JSON Builders ----------
def build_c11_anchor_payload(*, recipe: str, product_category: str, pose_label: str, 
                            consistency_token: str) -> dict:
    """
    Build anchor JSON payload for C11 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        product_category: Product category (e.g., 'electronics_gadgets', 'health_beauty')
        pose_label: Pose label (e.g., 'front_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the anchor payload for C11 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    pose_data = _build_pose_data(pose_label)
    quality_contract = _build_non_fashion_quality_contract()
    
    return {
        "version": "v7",
        "product_type": "non_fashion",
        "mode": "identity",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "product_category": product_category,
        "pose": pose_data,
        "intent": "anchor_product_identity",
        "directives": {
            "preserve": ["face_geometry", "eye_spacing", "nose_shape", "mouth_shape", "hairline", "hairstyle", "skin_tone", "product_appearance", "product_logos", "product_text"],
            "prohibit": ["beautification", "face_slimming", "age_change", "product_modification", "logo_changes"]
        },
        "locks": {
            "consistency_token": consistency_token,
            "lock_product": True,
            "lock_model_identity": True
        },
        "io_contract": {
            "images_order": {
                "product_cutout": "first_image",
                "identity_source": "second_image",
                "composition_canvas": "third_image"
            }
        },
        "quality_contract": quality_contract,
    }

def build_c11_followup_payload(*, recipe: str, product_category: str, pose_label: str, 
                              consistency_token: str) -> dict:
    """
    Build follow-up JSON payload for C11 combination
    
    Args:
        recipe: Recipe style (e.g., 'studio-clean')
        product_category: Product category (e.g., 'electronics_gadgets', 'health_beauty')
        pose_label: Pose label (e.g., 'three_quarter_full')
        consistency_token: Token for consistency across poses
        
    Returns:
        Dict containing the follow-up payload for C11 generation
    """
    from ...data import get_recipe_style
    
    recipe_style = get_recipe_style(recipe)
    pose_data = _build_pose_data(pose_label)
    quality_contract = _build_non_fashion_quality_contract()
    
    return {
        "version": "v7",
        "product_type": "non_fashion",
        "mode": "identity",
        "recipe": recipe,
        "recipe_style": recipe_style,
        "product_category": product_category,
        "pose": pose_data,
        "intent": "followup_match_anchor",
        "locks": {
            "consistency_token": consistency_token,
            "lock_product": True,
            "lock_model_identity": True,
            "lock_background_palette": True,
            "lock_background_geometry": False
        },
        "directives": {
            "preserve": ["model_face", "hair", "background_style", "product_appearance", "product_logos", "lighting"],
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

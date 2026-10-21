"""
House Model API for generating identity images from presets
==========================================================

Implementation for generating identity images from form-selected parameters.
Uses Gemini to generate identity images based on text descriptions with seed support for consistency.
"""

import os
import json
import io
import asyncio
import hashlib
import logging
import uuid
import time
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional
from PIL import Image
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Model attribute options
GENDER_OPTIONS = ["male", "female"]
AGE_OPTIONS = ["child", "teen", "young_adult", "adult", "mature", "senior"]
BUILD_OPTIONS = ["slim", "average", "athletic", "muscular", "heavyset", "plus_size"]
EYE_COLOR_OPTIONS = ["blue", "green", "brown", "hazel", "gray", "amber"]
HAIR_COLOR_OPTIONS = ["blonde", "brunette", "black", "red", "gray", "white", "auburn"]
HAIR_STYLE_OPTIONS = ["short", "medium", "long", "curly", "straight", "wavy", "bald", "buzz_cut"]
FACE_TYPE_OPTIONS = ["oval", "round", "square", "heart", "diamond", "oblong"]
ETHNICITY_OPTIONS = ["african", "asian", "caucasian", "hispanic", "middle_eastern", "mixed", "indian", "native_american"]
SKIN_TONE_OPTIONS = ["fair", "light", "medium", "olive", "tan", "dark", "deep"]
FACIAL_HAIR_OPTIONS = ["none", "mustache", "beard", "goatee", "stubble", "full_beard"]
ACCESSORIES_OPTIONS = ["none", "glasses", "sunglasses", "earrings", "hat", "scarf", "necklace"]
CLOTHING_STYLE_OPTIONS = ["casual", "formal", "sporty", "business", "traditional", "modern", "conservative"]
EXPRESSION_OPTIONS = ["happy", "neutral", "serious", "confident", "friendly", "professional"]

@dataclass
class HouseModelSpec:
    """House model specification with all attributes"""
    gender: str
    age: str
    build: str
    ethnicity: str
    eye_color: str = "brown"
    hair_color: str = "black"
    hair_style: str = "medium"
    face_type: str = "diamond"
    skin_tone: str = "fair"
    facial_hair: str = "none"
    accessories: str = "none"
    expression: str = "neutral"
    
    # Custom specification fields
    custom_gender: str = ""
    custom_age: str = ""
    custom_build: str = ""
    custom_eye_color: str = ""
    custom_hair_color: str = ""
    custom_hair_style: str = ""
    custom_face_type: str = ""
    custom_ethnicity: str = ""
    custom_skin_tone: str = ""
    custom_facial_hair: str = ""
    custom_accessories: str = ""
    custom_expression: str = ""
    
    def to_dict(self):
        return asdict(self)

class HouseModelAPI:
    """House Model Builder API"""
    
    def __init__(self):
        self.model_name = "gemini-2.5-flash-image-preview"
    
    def build_model_prompt(self, spec: HouseModelSpec, angle: str) -> str:
        """Build a detailed prompt for model generation based on specifications and angle"""
        
        # Helper function to get value (custom if provided, otherwise dropdown)
        def get_value(dropdown_val, custom_val):
            return custom_val.strip() if custom_val.strip() else dropdown_val
        
        # Get actual values to use in prompt
        gender = get_value(spec.gender, spec.custom_gender)
        age = get_value(spec.age, spec.custom_age)
        build = get_value(spec.build, spec.custom_build)
        ethnicity = get_value(spec.ethnicity, spec.custom_ethnicity)
        skin_tone = get_value(spec.skin_tone, spec.custom_skin_tone)
        eye_color = get_value(spec.eye_color, spec.custom_eye_color)
        hair_color = get_value(spec.hair_color, spec.custom_hair_color)
        hair_style = get_value(spec.hair_style, spec.custom_hair_style)
        face_type = get_value(spec.face_type, spec.custom_face_type)
        facial_hair = get_value(spec.facial_hair, spec.custom_facial_hair)
        accessories = get_value(spec.accessories, spec.custom_accessories)
        expression = get_value(spec.expression, spec.custom_expression)
        
        # Base description
        prompt_parts = [
            f"A {age} {gender} model",
            f"with {build} build",
            f"and {ethnicity} ethnicity",
            f"having {skin_tone} skin tone",
            f"with {eye_color} eyes",
            f"and {hair_color} {hair_style} hair",
            f"with {face_type} face shape"
        ]
        
        # Add facial hair if applicable
        if facial_hair != "none":
            prompt_parts.append(f"wearing {facial_hair}")
        
        # Add accessories if applicable
        if accessories != "none":
            prompt_parts.append(f"wearing {accessories}")
        
        # Add expression
        prompt_parts.append(f"with a {expression} expression")
        
        # Add angle-specific instructions for headshot mode
        angle_instructions = {
            "front": "facing directly towards camera, full frontal view, centered composition, head and shoulders visible",
            "side": "profile view, side angle, showing the side of the face and shoulders",
            "back": "back view, showing the back of the head and shoulders",
            "three_quarter": "three-quarter angle view, slightly turned to show both front and side, head and shoulders"
        }
        prompt_parts.append(angle_instructions.get(angle, "facing camera, headshot view"))
        
        # Add quality and style instructions for headshot mode
        prompt_parts.extend([
            "high resolution professional photography",
            "clean studio background", 
            "professional lighting",
            "sharp focus",
            "commercial photography style",
            "model headshot quality",
            "hyperrealistic",
            "photorealistic",
            "natural skin texture",
            "realistic hair detail",
            "professional studio quality",
            "8K resolution",
            "detailed facial features",
            "natural lighting",
            "perfect focus",
            "commercial grade photography",
            "human imperfections",
            "natural asymmetry",
            "subtle skin blemishes",
            "realistic pores",
            "natural hair flyaways",
            "slight skin tone variations",
            "natural expression lines",
            "imperfect but beautiful",
            "realistic human flaws",
            "authentic human appearance",
            "headshot composition",
            "portrait photography"
        ])
        
        # Add seed for consistency
        seed = self.generate_consistent_seed(spec)
        prompt_parts.append(f"model ID {seed}")
        
        return ", ".join(prompt_parts)
    
    def generate_consistent_seed(self, spec: HouseModelSpec) -> str:
        """Generate a consistent seed based on model specifications"""
        # Create a hash from the core identity attributes (excluding angle)
        identity_string = f"{spec.gender}_{spec.age}_{spec.ethnicity}_{spec.eye_color}_{spec.hair_color}_{spec.skin_tone}"
        return hashlib.md5(identity_string.encode()).hexdigest()[:8]
    
    async def generate_model_angle(self, spec: HouseModelSpec, angle: str, model_name: str = "gemini-2.5-flash-image-preview") -> Dict[str, Any]:
        """Generate a single model image for a specific angle using new SDK with seed support"""
        
        # Build prompt for this angle
        prompt = self.build_model_prompt(spec, angle)
        
        # Generate consistent seed
        seed = self.generate_consistent_seed(spec)
        seed_int = int(seed, 16) & 0x7FFFFFFF  # Convert hex to valid non-negative int32
        
        # System instruction for consistent headshot generation
        sys_inst = f"""You are a professional portrait photographer. Generate a high-quality, realistic headshot based on the specifications provided. 
        
        FOCUS ON:
        - Accurate representation of all specified physical attributes
        - Professional headshot photography quality
        - Consistent lighting and composition
        - Commercial headshot standards
        - Natural, realistic appearance
        - Face and upper body framing
        
        HEADSHOT REQUIREMENTS:
        - Hyperrealistic skin texture with natural pores, fine lines, and subtle imperfections
        - Realistic hair with individual strands, natural shine, and depth
        - Natural eye reflections, iris detail, and realistic eyelashes
        - Proper subsurface scattering for skin translucency
        - Professional studio lighting with natural shadows and highlights
        - High dynamic range with proper exposure and contrast
        - Portrait composition focusing on face and shoulders
        - No artificial smoothing, plastic appearance, or uncanny valley effects
        
        HUMAN IMPERFECTIONS (REQUIRED):
        - Subtle skin blemishes, freckles, or birthmarks
        - Natural asymmetry in facial features
        - Slightly uneven skin tone or texture variations
        - Natural hair flyaways and imperfections
        - Subtle wrinkles, laugh lines, or expression lines
        - Realistic skin texture with pores and natural variations
        - Natural lighting variations and subtle shadows
        - Imperfect but natural expressions
        
        The model should look like a real person, not a cartoon or illustration.
        
        IMPORTANT: This is model ID {seed} - maintain consistency across all angles for this same model identity."""
        
        try:
            # Use new SDK with seed support
            client = genai.Client()  # picks up GOOGLE_API_KEY / GEMINI_API_KEY
            
            # Generate content with seed for consistency
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        temperature=0.3,  # Slightly higher for more natural variation
                        top_p=0.9,
                        top_k=40,
                        seed=seed_int,  # Real seed support!
                        system_instruction=sys_inst
                    )
                )
            )
            
            # Extract image from response
            image_bytes = None
            for candidate in getattr(response, "candidates", []) or []:
                content = getattr(candidate, "content", None)
                if content:
                    parts = getattr(content, "parts", []) or []
                    for part in parts:
                        inline_data = getattr(part, "inline_data", None)
                        if inline_data and inline_data.mime_type.startswith("image/"):
                            image_bytes = inline_data.data
                            break
                if image_bytes:
                    break
            
            if not image_bytes:
                raise RuntimeError(f"No image generated for angle: {angle}")
            
            return {
                "success": True,
                "angle": angle,
                "image_bytes": image_bytes,
                "seed": seed,
                "prompt": prompt
            }
            
        except Exception as e:
            logger.error(f"Error generating model for angle {angle}: {str(e)}")
            return {
                "success": False,
                "angle": angle,
                "error": str(e),
                "seed": seed
            }
    
    def validate_model_spec(self, data: Dict[str, Any]) -> HouseModelSpec:
        """Validate and create HouseModelSpec from form data"""
        
        # Validate required fields
        required_fields = ["gender", "age", "build", "eye_color", "hair_color", "hair_style", "face_type", "ethnicity", "skin_tone"]
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate against options (skip validation if custom value is provided)
        validations = {
            "gender": GENDER_OPTIONS,
            "age": AGE_OPTIONS,
            "build": BUILD_OPTIONS,
            "eye_color": EYE_COLOR_OPTIONS,
            "hair_color": HAIR_COLOR_OPTIONS,
            "hair_style": HAIR_STYLE_OPTIONS,
            "face_type": FACE_TYPE_OPTIONS,
            "ethnicity": ETHNICITY_OPTIONS,
            "skin_tone": SKIN_TONE_OPTIONS
        }
        
        for field, valid_options in validations.items():
            # Check if custom value is provided and not empty
            custom_field = f"custom_{field}"
            if custom_field in data and data[custom_field].strip():
                # Use custom value, skip validation
                data[field] = data[custom_field].strip()
            elif data[field] not in valid_options:
                raise ValueError(f"Invalid {field}: {data[field]}. Valid options: {', '.join(valid_options)}")
        
        # Optional fields with defaults
        optional_fields = {
            "facial_hair": "none",
            "accessories": "none", 
            "expression": "neutral"
        }
        
        for field, default in optional_fields.items():
            if field not in data or not data[field]:
                data[field] = default
            
            # Check if custom value is provided for optional fields
            custom_field = f"custom_{field}"
            if custom_field in data and data[custom_field].strip():
                data[field] = data[custom_field].strip()
        
        return HouseModelSpec(**data)
    
    def get_model_options(self) -> Dict[str, List[str]]:
        """Get available options for model attributes"""
        return {
            "gender": GENDER_OPTIONS,
            "age": AGE_OPTIONS,
            "build": BUILD_OPTIONS,
            "ethnicity": ETHNICITY_OPTIONS,
            "eye_color": EYE_COLOR_OPTIONS,
            "hair_color": HAIR_COLOR_OPTIONS,
            "hair_style": HAIR_STYLE_OPTIONS,
            "face_type": FACE_TYPE_OPTIONS,
            "skin_tone": SKIN_TONE_OPTIONS,
            "facial_hair": FACIAL_HAIR_OPTIONS,
            "accessories": ACCESSORIES_OPTIONS,
            "expression": EXPRESSION_OPTIONS
        }

# Create global instance
house_model_api = HouseModelAPI()

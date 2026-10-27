"""
Color Scheme Detection: Analyze product images to detect suitable color scheme
"""
import requests
import logging
import mimetypes
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from ...clients.gemini_client import client as gemini_client
from google.genai import types as gatypes
import json
import re  # Still needed for field_validator

logger = logging.getLogger(__name__)


class ColorSchemeResponse(BaseModel):
    """Pydantic model for color scheme detection response"""
    colors: List[str] = Field(
        description="List of 4 hex color codes in format #RRGGBB",
        min_length=4,
        max_length=4
    )
    
    @field_validator('colors')
    @classmethod
    def validate_colors(cls, v: List[str]) -> List[str]:
        """Validate and normalize hex color codes"""
        if len(v) != 4:
            raise ValueError(f"Must provide exactly 4 colors, got {len(v)}")
        validated_colors = []
        for color in v:
            color = color.upper().strip()
            if not re.match(r'^#[0-9A-Fa-f]{6}$', color):
                raise ValueError(f"Invalid hex color format: {color}. Must be #RRGGBB")
            validated_colors.append(color)
        return validated_colors


def download_image_as_bytes(image_url: str) -> Optional[tuple]:
    """
    Download an image from URL and return as bytes with mime type.
    
    Args:
        image_url: URL of the image to download
        
    Returns:
        Tuple of (image_bytes, mime_type) or None if download fails
    """
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Get image format
        content_type = response.headers.get('content-type', 'image/jpeg')
        if not content_type or not content_type.startswith('image/'):
            # Try to guess from URL or default to jpeg
            content_type = mimetypes.guess_type(image_url)[0] or 'image/jpeg'
        
        return (response.content, content_type)
    except Exception as e:
        logger.error(f"Error downloading image from {image_url}: {str(e)}")
        return None


def detect_color_scheme(product_images) -> Optional[List[str]]:
    """
    Detect top 4 suitable color schemes (hex colors) from product images using LLM vision.
    
    Args:
        product_images: Dict[str, str] or List[str] of product image URLs
        
    Returns:
        List of 4 hex color codes (e.g., ["#FF5733", "#33FF57", "#5733FF", "#FF3357"]) or None if detection fails
    """
    if not product_images:
        logger.warning("No product images provided for color detection")
        return None
    
    try:
        # Handle both dict and list inputs
        if isinstance(product_images, dict):
            image_urls = list(product_images.values())
        elif isinstance(product_images, list):
            image_urls = product_images
        else:
            logger.warning(f"Invalid product_images type: {type(product_images)}")
            return None
        
        # Download images as bytes
        image_parts = []
        for i, image_url in enumerate(image_urls):
            if i >= 2:
                break
            image_data = download_image_as_bytes(image_url)
            if image_data:
                image_bytes, mime_type = image_data
                image_parts.append(
                    gatypes.Part.from_bytes(mime_type=mime_type, data=image_bytes)
                )
        
        if not image_parts:
            logger.warning("Failed to download any images for color detection")
            return None
        
        # Create prompt for color detection
        system_instruction = """You are a color expert specializing in product design and branding. 
            Analyze the provided product images and determine the top 4 most suitable color schemes that would complement the product.
            Consider the subtle and firm colors, product aesthetics, and brand appeal. Avoid too soft colors.
            Focus on product only, not background or other elements.
            This color will go on buttons and banners and text on top of it will be white.
            So give colors in a way that white text on top of it doesnot look odd.
            Colors will be used to design an e commerce product page.
            The colors should be ordered from most suitable to least suitable.
            """
        
        user_prompt = """Analyze these product images and determine the top 4 most suitable color schemes.
                Return a JSON object with the following exact format:
                {
                "colors": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"]
                }
                The hex color codes should best represent the product's aesthetic and work well for UI elements, buttons, and accents on an e-commerce product page.
                Provide exactly 4 colors, ordered from most suitable to least suitable.
                Return only the JSON object, no markdown code blocks or additional text."""
        
        # Build contents with text prompt and images
        contents = [
            user_prompt,
        ] + image_parts
        
        # Configure Gemini API call
        config = gatypes.GenerateContentConfig(
            temperature=0.3,  # Lower temperature for more consistent results
            system_instruction=system_instruction
        )
        
        # Call Gemini API
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash-image",  # Using Gemini Flash for cost efficiency, supports vision
            contents=contents,
            config=config
        )
        
        # Extract text response
        text_response = None
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_response = part.text.strip()
                            break
        
        if not text_response:
            logger.warning("No text response from Gemini")
            return None
        
        # Parse JSON and validate using Pydantic model
        try:
            json_data = json.loads(text_response)
            color_response = ColorSchemeResponse(**json_data)
            colors = color_response.colors
            
            logger.info(f"Detected color schemes: {colors}")
            return colors
                
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Error parsing or validating color scheme response: {str(e)}")
            return None
                
    except Exception as e:
        logger.error(f"Error detecting color scheme: {str(e)}")
        return None


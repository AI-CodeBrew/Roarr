"""
Emagen Router: Main routing logic for combination selection
===========================================================

This module handles the main routing logic that determines which combination
to execute based on user selections from step 1 and step 2.
"""

import logging
from typing import Dict, Any, Optional, Tuple
import asyncio

logger = logging.getLogger(__name__)

def determine_combination(product_type: str, display_type: str, identity_option: str) -> str:
    """
    Determine which combination to use based on user selections
    
    Args:
        product_type: Type of product (e.g., 'clothing')
        display_type: How to display the product ('product_only', 'product_on_mannequin', 'product_on_human')
        identity_option: Identity selection method ('uploaded', 'form_selected')
        
    Returns:
        Combination identifier (C1, C2, C3, C4, C5, C6)
        
    Raises:
        ValueError: If the combination is not supported
    """
    # Normalize inputs
    product_type = product_type.lower().strip()
    display_type = display_type.lower().strip()
    identity_option = identity_option.lower().strip()
    
    # Validate product type
    if product_type not in ['clothing', 'non-clothing']:
        raise ValueError(f"Unsupported product type: {product_type}. Supported types: 'clothing', 'non-clothing'.")
    
    # Map selections to combinations
    combination_map = {
        # Clothing combinations
        ('clothing', 'product_only', 'uploaded'): 'C1',
        ('clothing', 'product_on_mannequin', 'uploaded'): 'C2', 
        ('clothing', 'product_on_human', 'uploaded'): 'C3',
        ('clothing', 'product_only', 'form_selected'): 'C4',
        ('clothing', 'product_on_mannequin', 'form_selected'): 'C5',
        ('clothing', 'product_on_human', 'form_selected'): 'C6',
        
        # Non-clothing combinations
        ('non-clothing', 'product_only', 'uploaded'): 'C7',
        ('non-clothing', 'product_on_mannequin', 'uploaded'): 'C8', 
        ('non-clothing', 'product_on_human', 'uploaded'): 'C9',
        ('non-clothing', 'product_only', 'form_selected'): 'C10',
        ('non-clothing', 'product_on_mannequin', 'form_selected'): 'C11',
        ('non-clothing', 'product_on_human', 'form_selected'): 'C12',
    }
    
    key = (product_type, display_type, identity_option)
    combination = combination_map.get(key)
    
    if not combination:
        valid_combinations = [
            "clothing + product_only + uploaded",
            "clothing + product_on_mannequin + uploaded", 
            "clothing + product_on_human + uploaded",
            "clothing + product_only + form_selected",
            "clothing + product_on_mannequin + form_selected",
            "clothing + product_on_human + form_selected",
            "non-clothing + product_only + uploaded",
            "non-clothing + product_on_mannequin + uploaded", 
            "non-clothing + product_on_human + uploaded",
            "non-clothing + product_only + form_selected",
            "non-clothing + product_on_mannequin + form_selected",
            "non-clothing + product_on_human + form_selected"
        ]
        raise ValueError(
            f"Unsupported combination: {product_type} + {display_type} + {identity_option}. "
            f"Valid combinations: {', '.join(valid_combinations)}"
        )
    
    logger.info(f"Selected combination {combination} for: {product_type} + {display_type} + {identity_option}")
    return combination

async def generate_emagen_shotpack(
    product_type: str,
    display_type: str, 
    identity_option: str,
    recipe: str,
    garment_type: str,
    product_bytes: bytes,
    identity_data: Any,  # Can be bytes for uploaded or dict for form-selected
    **kwargs
) -> Dict[str, Any]:
    """
    Generate shotpack using the appropriate combination
    
    Args:
        product_type: Type of product
        display_type: How to display the product
        identity_option: Identity selection method
        recipe: Recipe style (e.g., 'studio-clean')
        garment_type: Type of garment (e.g., 'top', 'dress')
        product_bytes: Product image as bytes
        identity_data: Identity data (bytes for uploaded, dict for form-selected)
        **kwargs: Additional parameters
        
    Returns:
        Dict containing generation results
    """
    try:
        # Determine which combination to use
        combination = determine_combination(product_type, display_type, identity_option)
        
        logger.info(f"Generating shotpack using combination {combination}")
        
        # Route to appropriate combination handler
        if combination == 'C1':
            from .combinations.C1 import generate_c1_shotpack
            
            # For C1, identity_data should be bytes (uploaded image)
            if not isinstance(identity_data, bytes):
                raise ValueError("C1 requires uploaded identity image as bytes")
                
            return await generate_c1_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                product_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C2':
            from .combinations.C2.generator import generate_c2_shotpack
            
            # For C2, identity_data should be bytes (uploaded image)
            if not isinstance(identity_data, bytes):
                raise ValueError("C2 requires uploaded identity image as bytes")
                
            return await generate_c2_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                mannequin_product_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C3':
            from .combinations.C3.generator import generate_c3_shotpack
            
            # For C3, identity_data should be bytes (uploaded image)
            if not isinstance(identity_data, bytes):
                raise ValueError("C3 requires uploaded identity image as bytes")
                
            return await generate_c3_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                product_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C4':
            from .combinations.C4.generator import generate_c4_shotpack
            
            # For C4, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C4 requires form_selected identity_option with identity_data as dict")
                
            return await generate_c4_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                product_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        elif combination == 'C5':
            from .combinations.C5.generator import generate_c5_shotpack
            
            # For C5, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C5 requires form_selected identity_option with identity_data as dict")
                
            return await generate_c5_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                mannequin_product_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        elif combination == 'C6':
            from .combinations.C6.generator import generate_c6_shotpack
            
            # For C6, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C6 requires form_selected identity_option with identity_data as dict")
                
            return await generate_c6_shotpack(
                recipe=recipe,
                garment_type=garment_type,
                product_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        elif combination == 'C7':
            from .combinations.C7.generator import generate_c7_shotpack
            
            # For C7, identity_data should be bytes (uploaded)
            if not isinstance(identity_data, bytes):
                raise ValueError("C7 requires uploaded identity_option with identity_data as bytes")
                
            return await generate_c7_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                product_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C8':
            from .combinations.C8.generator import generate_c8_shotpack
            
            # For C8, identity_data should be bytes (uploaded)
            if not isinstance(identity_data, bytes):
                raise ValueError("C8 requires uploaded identity_option with identity_data as bytes")
                
            return await generate_c8_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                mannequin_product_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C9':
            from .combinations.C9.generator import generate_c9_shotpack
            
            # For C9, identity_data should be bytes (uploaded)
            if not isinstance(identity_data, bytes):
                raise ValueError("C9 requires uploaded identity_option with identity_data as bytes")
                
            return await generate_c9_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                product_on_human_bytes=product_bytes,
                identity_bytes=identity_data
            )
            
        elif combination == 'C10':
            from .combinations.C10.generator import generate_c10_shotpack
            
            # For C10, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C10 requires form-selected identity_option with identity_data as dict")
                
            return await generate_c10_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                product_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        elif combination == 'C11':
            from .combinations.C11.generator import generate_c11_shotpack
            
            # For C11, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C11 requires form-selected identity_option with identity_data as dict")
                
            return await generate_c11_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                mannequin_product_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        elif combination == 'C12':
            from .combinations.C12.generator import generate_c12_shotpack
            
            # For C12, identity_data should be dict (form-selected)
            if not isinstance(identity_data, dict):
                raise ValueError("C12 requires form-selected identity_option with identity_data as dict")
                
            return await generate_c12_shotpack(
                recipe=recipe,
                product_category=garment_type,  # Use garment_type as product_category for non-fashion
                product_on_human_bytes=product_bytes,
                identity_preset=identity_data
            )
            
        else:
            raise ValueError(f"Unknown combination: {combination}")
            
    except Exception as e:
        logger.error(f"Emagen shotpack generation failed: {str(e)}")
        raise RuntimeError(f"Shotpack generation failed: {str(e)}")

def get_available_combinations() -> Dict[str, Dict[str, Any]]:
    """
    Get information about available combinations
    
    Returns:
        Dict mapping combination IDs to their descriptions
    """
    return {
        'C1': {
            'description': 'Clothing + Product only + Identity uploaded',
            'product_type': 'clothing',
            'display_type': 'product_only', 
            'identity_option': 'uploaded',
            'status': 'implemented'
        },
        'C2': {
            'description': 'Clothing + Product on mannequin + Identity uploaded',
            'product_type': 'clothing',
            'display_type': 'product_on_mannequin',
            'identity_option': 'uploaded', 
            'status': 'implemented'
        },
        'C3': {
            'description': 'Clothing + Product on human + Identity uploaded',
            'product_type': 'clothing',
            'display_type': 'product_on_human',
            'identity_option': 'uploaded',
            'status': 'implemented'
        },
        'C4': {
            'description': 'Clothing + Product only + Identity selected through form',
            'product_type': 'clothing',
            'display_type': 'product_only',
            'identity_option': 'form_selected',
            'status': 'implemented'
        },
        'C5': {
            'description': 'Clothing + Product on mannequin + Identity selected through form',
            'product_type': 'clothing',
            'display_type': 'product_on_mannequin',
            'identity_option': 'form_selected',
            'status': 'implemented'
        },
        'C6': {
            'description': 'Clothing + Product on human + Identity selected through form',
            'product_type': 'clothing',
            'display_type': 'product_on_human',
            'identity_option': 'form_selected',
            'status': 'implemented'
        },
        'C7': {
            'description': 'Non-Clothing + Product only + Identity uploaded',
            'product_type': 'non-clothing',
            'display_type': 'product_only',
            'identity_option': 'uploaded',
            'status': 'implemented'
        },
        'C8': {
            'description': 'Non-Clothing + Product on mannequin + Identity uploaded',
            'product_type': 'non-clothing',
            'display_type': 'product_on_mannequin',
            'identity_option': 'uploaded',
            'status': 'implemented'
        },
        'C9': {
            'description': 'Non-Clothing + Product on human + Identity uploaded',
            'product_type': 'non-clothing',
            'display_type': 'product_on_human',
            'identity_option': 'uploaded',
            'status': 'implemented'
        },
        'C10': {
            'description': 'Non-Clothing + Product only + Identity selected through form',
            'product_type': 'non-clothing',
            'display_type': 'product_only',
            'identity_option': 'form_selected',
            'status': 'implemented'
        },
        'C11': {
            'description': 'Non-Clothing + Product on mannequin + Identity selected through form',
            'product_type': 'non-clothing',
            'display_type': 'product_on_mannequin',
            'identity_option': 'form_selected',
            'status': 'implemented'
        },
        'C12': {
            'description': 'Non-Clothing + Product on human + Identity selected through form',
            'product_type': 'non-clothing',
            'display_type': 'product_on_human',
            'identity_option': 'form_selected',
            'status': 'implemented'
        }
    }

"""
C12 Combination Module: Non-Fashion + Product on Human + Identity Form Selected
==============================================================================

This module handles C12 combination generation for non-fashion products
with face swap verification and house model generation - the final combination!
"""

from .generator import generate_c12_shotpack
from .prompt_builder import (
    build_c12_face_swap_payload, 
    build_c12_shotpack_payload, 
    get_c12_system_instruction,
    validate_c12_parameters
)

__all__ = [
    'generate_c12_shotpack',
    'build_c12_face_swap_payload',
    'build_c12_shotpack_payload', 
    'get_c12_system_instruction',
    'validate_c12_parameters'
]

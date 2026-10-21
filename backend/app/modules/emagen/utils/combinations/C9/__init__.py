"""
C9 Combination Module: Non-Fashion + Product on Human + Uploaded Identity
=========================================================================

This module handles C9 combination generation for non-fashion products
with face swap verification and uploaded identity integration.
"""

from .generator import generate_c9_shotpack
from .prompt_builder import (
    build_c9_face_swap_payload, 
    build_c9_shotpack_payload, 
    get_c9_system_instruction,
    validate_c9_parameters
)

__all__ = [
    'generate_c9_shotpack',
    'build_c9_face_swap_payload',
    'build_c9_shotpack_payload', 
    'get_c9_system_instruction',
    'validate_c9_parameters'
]

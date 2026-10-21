"""
C8 Combination Module: Non-Fashion + Product on Mannequin + Uploaded Identity
=============================================================================

This module handles C8 combination generation for non-fashion products
with mannequin preprocessing and uploaded identity integration.
"""

from .generator import generate_c8_shotpack
from .prompt_builder import (
    build_c8_anchor_payload, 
    build_c8_followup_payload, 
    get_c8_system_instruction,
    validate_c8_parameters
)

__all__ = [
    'generate_c8_shotpack',
    'build_c8_anchor_payload',
    'build_c8_followup_payload', 
    'get_c8_system_instruction',
    'validate_c8_parameters'
]

"""
C11 Combination Module: Non-Fashion + Product on Mannequin + Identity Form Selected
==================================================================================

This module handles C11 combination generation for non-fashion products
with mannequin preprocessing and house model generation.
"""

from .generator import generate_c11_shotpack
from .prompt_builder import (
    build_c11_anchor_payload, 
    build_c11_followup_payload, 
    get_c11_system_instruction,
    validate_c11_parameters
)

__all__ = [
    'generate_c11_shotpack',
    'build_c11_anchor_payload',
    'build_c11_followup_payload', 
    'get_c11_system_instruction',
    'validate_c11_parameters'
]

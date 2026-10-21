"""
C10 Combination Module: Non-Fashion + Product only + Identity Form Selected
===========================================================================

This module handles C10 combination generation for non-fashion products
with house model generation and form-selected identity integration.
"""

from .generator import generate_c10_shotpack
from .prompt_builder import (
    build_c10_anchor_payload, 
    build_c10_followup_payload, 
    get_c10_system_instruction,
    validate_c10_parameters
)

__all__ = [
    'generate_c10_shotpack',
    'build_c10_anchor_payload',
    'build_c10_followup_payload', 
    'get_c10_system_instruction',
    'validate_c10_parameters'
]

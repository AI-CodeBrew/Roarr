"""
Emagen Utils: AI-powered product visualization
==============================================

This module provides the backend functionality for the Emagen feature,
which generates product visualizations based on user selections.

Combination Logic:
- C1: Clothing + Product only + Identity uploaded (option 1)
- C2: Clothing + Product on mannequin + Identity uploaded (option 1)  
- C3: Clothing + Product on human + Identity uploaded (option 1)
- C4: Clothing + Product only + Identity selected through form (option 2)
- C5: Clothing + Product on mannequin + Identity selected through form (option 2)
- C6: Clothing + Product on human + Identity selected through form (option 2)
"""

from .router import determine_combination, generate_emagen_shotpack
from .data import get_pose_rule, select_poses, get_recipe_style

__all__ = [
    'determine_combination',
    'generate_emagen_shotpack', 
    'get_pose_rule',
    'select_poses',
    'get_recipe_style'
]

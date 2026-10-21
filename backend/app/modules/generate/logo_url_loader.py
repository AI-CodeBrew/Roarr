"""
Logo URL loader utility
Loads pre-defined logo URLs from the logos.json files in each category
"""

import os
import json
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LogoUrlLoader:
    """Loads pre-defined logo URLs from logos.json files"""
    
    def __init__(self):
        self.base_path = os.path.join(os.path.dirname(__file__), 'templates')
    
    def load_logo_urls(self, category: str) -> Optional[Dict[str, str]]:
        """
        Load logo URLs for a specific category
        
        Args:
            category: Category name (e.g., 'health_beauty')
            
        Returns:
            Dictionary containing logo URLs or None if not found
        """
        try:
            # Convert category to lowercase and replace spaces with underscores
            category_clean = category.lower().replace(' ', '_').replace('/', '_')
            
            # Handle category mapping
            category_mapping = {
                "health and beauty": "health_beauty",
                "health_beauty": "health_beauty",
                "health & beauty": "health_beauty",
                "beauty / health": "health_beauty",
                "general": "general",
                "generic": "general"  # Backward compatibility
            }
            category_clean = category_mapping.get(category_clean, category_clean)
            
            # Construct file path
            logos_file = "logos.json"
            file_path = os.path.join(self.base_path, category_clean, logos_file)
            
            if not os.path.exists(file_path):
                logger.warning(f"Logos file not found: {file_path}")
                return None
            
            # Load the JSON file
            with open(file_path, 'r', encoding='utf-8') as f:
                logo_urls = json.load(f)
            
            logger.info(f"Successfully loaded logo URLs for {category_clean}")
            return logo_urls
                
        except Exception as e:
            logger.error(f"Error loading logo URLs for {category}: {e}")
            return None
    

# Global instance
logo_url_loader = LogoUrlLoader()

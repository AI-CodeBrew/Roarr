"""
Storage utilities for Emagin app
Handles image storage, file management, and storage operations
"""

import os
import uuid
import shutil
from datetime import datetime
from PIL import Image
import base64
import io
from pathlib import Path

class StorageManager:
    def __init__(self, base_path="storage"):
        self.base_path = Path(base_path)
        self.images_path = self.base_path / "images"
        self.uploads_path = self.base_path / "uploads"
        self.generated_path = self.base_path / "generated"
        
        # Create directories if they don't exist
        self.images_path.mkdir(parents=True, exist_ok=True)
        self.uploads_path.mkdir(parents=True, exist_ok=True)
        self.generated_path.mkdir(parents=True, exist_ok=True)
    
    def save_uploaded_image(self, image_data, filename=None):
        """
        Save an uploaded image to storage
        Args:
            image_data: Base64 encoded image data or file object
            filename: Optional custom filename
        Returns:
            dict: {'success': bool, 'path': str, 'filename': str, 'error': str}
        """
        try:
            # Generate unique filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                unique_id = str(uuid.uuid4())[:8]
                filename = f"upload_{timestamp}_{unique_id}.jpg"
            
            # Ensure filename has proper extension
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                filename += '.jpg'
            
            file_path = self.uploads_path / filename
            
            # Handle base64 data
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                
                # Open and process image
                image = Image.open(io.BytesIO(image_bytes))
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Save with optimization
                image.save(file_path, 'JPEG', quality=85, optimize=True)
                
            else:
                # Handle file object
                with open(file_path, 'wb') as f:
                    f.write(image_data)
            
            return {
                'success': True,
                'path': str(file_path),
                'filename': filename,
                'url': f'/storage/uploads/{filename}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_generated_image(self, image_data, prefix="generated", filename=None):
        """
        Save a generated image to S3 and return the public URL
        Args:
            image_data: Base64 encoded image data or PIL Image object
            prefix: Prefix for the filename
            filename: Optional custom filename
        Returns:
            dict: {'success': bool, 'path': str, 'filename': str, 'url': str, 'error': str}
        """
        try:
            # Import AWS utils
            from app.modules.storage.utils import StorageUtils
            
            # Generate unique filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                unique_id = str(uuid.uuid4())[:8]
                filename = f"{prefix}_{timestamp}_{unique_id}.jpg"
            
            # Ensure filename has proper extension
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                filename += '.jpg'
            
            # Create temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file_path = temp_file.name
                
                # Handle PIL Image object
                if hasattr(image_data, 'save'):
                    # Convert to RGB if necessary
                    if image_data.mode != 'RGB':
                        image_data = image_data.convert('RGB')
                    image_data.save(temp_file_path, 'JPEG', quality=90, optimize=True)
                    
                # Handle base64 data
                elif isinstance(image_data, str) and image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    
                    image = Image.open(io.BytesIO(image_bytes))
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    image.save(temp_file_path, 'JPEG', quality=90, optimize=True)
                    
                else:
                    # Handle raw bytes
                    temp_file.write(image_data)
                    temp_file.flush()
            
            try:
                # Upload to Bunny CDN
                cdn_url = StorageUtils.upload_public(temp_file_path, filename)
                
                if cdn_url:
                    return {
                        'success': True,
                        'path': cdn_url,
                        'filename': filename,
                        'url': s3_url
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Failed to upload to Bunny CDN'
                    }
                    
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_image_info(self, filename, category="uploads"):
        """
        Get information about a stored image
        Args:
            filename: Name of the file
            category: 'uploads', 'generated', or 'images'
        Returns:
            dict: File information or error
        """
        try:
            if category == "uploads":
                file_path = self.uploads_path / filename
            elif category == "generated":
                file_path = self.generated_path / filename
            elif category == "images":
                file_path = self.images_path / filename
            else:
                return {'success': False, 'error': 'Invalid category'}
            
            if not file_path.exists():
                return {'success': False, 'error': 'File not found'}
            
            stat = file_path.stat()
            
            # Get image dimensions if it's an image
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
                    format_name = img.format
            except:
                width, height = None, None
                format_name = None
            
            return {
                'success': True,
                'filename': filename,
                'path': str(file_path),
                'size': stat.st_size,
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'width': width,
                'height': height,
                'format': format_name,
                'url': f'/storage/{category}/{filename}'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def list_images(self, category="uploads", limit=50):
        """
        List images in a category
        Args:
            category: 'uploads', 'generated', or 'images'
            limit: Maximum number of files to return
        Returns:
            list: List of image information dictionaries
        """
        try:
            if category == "uploads":
                directory = self.uploads_path
            elif category == "generated":
                directory = self.generated_path
            elif category == "images":
                directory = self.images_path
            else:
                return []
            
            images = []
            for file_path in directory.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                    info = self.get_image_info(file_path.name, category)
                    if info['success']:
                        images.append(info)
            
            # Sort by modification time (newest first)
            images.sort(key=lambda x: x['modified'], reverse=True)
            
            return images[:limit]
            
        except Exception as e:
            return []
    
    def delete_image(self, filename, category="uploads"):
        """
        Delete an image from storage
        Args:
            filename: Name of the file to delete
            category: 'uploads', 'generated', or 'images'
        Returns:
            dict: Success status
        """
        try:
            if category == "uploads":
                file_path = self.uploads_path / filename
            elif category == "generated":
                file_path = self.generated_path / filename
            elif category == "images":
                file_path = self.images_path / filename
            else:
                return {'success': False, 'error': 'Invalid category'}
            
            if file_path.exists():
                file_path.unlink()
                return {'success': True, 'message': f'File {filename} deleted successfully'}
            else:
                return {'success': False, 'error': 'File not found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def cleanup_old_files(self, days=30, category="uploads"):
        """
        Clean up files older than specified days
        Args:
            days: Number of days to keep files
            category: 'uploads', 'generated', or 'images'
        Returns:
            dict: Cleanup results
        """
        try:
            if category == "uploads":
                directory = self.uploads_path
            elif category == "generated":
                directory = self.generated_path
            elif category == "images":
                directory = self.images_path
            else:
                return {'success': False, 'error': 'Invalid category'}
            
            cutoff_time = datetime.now().timestamp() - (days * 24 * 60 * 60)
            deleted_count = 0
            
            for file_path in directory.iterdir():
                if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                    file_path.unlink()
                    deleted_count += 1
            
            return {
                'success': True,
                'deleted_count': deleted_count,
                'message': f'Cleaned up {deleted_count} files older than {days} days'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Global storage manager instance
storage_manager = StorageManager()

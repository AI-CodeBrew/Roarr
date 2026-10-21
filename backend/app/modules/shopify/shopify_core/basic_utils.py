import os
import zipfile
import shutil
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class BasicUtils:
    def __init__(self):
        pass
    
    def create_zip_file(self, source_path: str, zip_path: str = None) -> Dict[str, Any]:
        """
        Create a zip file from a given path (file or directory)
        
        Args:
            source_path: Path to the file or directory to zip
            zip_path: Optional custom zip file path, defaults to source_path + .zip
            
        Returns:
            Dict containing zip creation result
        """
        try:
            source_path = Path(source_path)
            
            if not source_path.exists():
                error_msg = f"Source path does not exist: {source_path}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
            
            # Generate zip path if not provided
            if not zip_path:
                zip_path = str(source_path) + '.zip'
            
            zip_path = Path(zip_path)
            
            # Create zip file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                if source_path.is_file():
                    # Single file
                    zipf.write(source_path, source_path.name)
                    logger.info(f"Zipped file: {source_path} -> {zip_path}")
                else:
                    # Directory - zip all contents
                    for root, dirs, files in os.walk(source_path):
                        for file in files:
                            file_path = Path(root) / file
                            # Create relative path for zip
                            arcname = file_path.relative_to(source_path.parent)
                            zipf.write(file_path, arcname)
                    logger.info(f"Zipped directory: {source_path} -> {zip_path}")
            
            return {
                'success': True,
                'zip_path': str(zip_path),
                'source_path': str(source_path),
                'zip_size': zip_path.stat().st_size
            }
            
        except PermissionError as e:
            error_msg = f"Permission denied: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
            
        except zipfile.BadZipFile as e:
            error_msg = f"Bad zip file error: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
            
        except Exception as e:
            error_msg = f"Unexpected error creating zip: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def delete_file_or_dir(self, path: str) -> Dict[str, Any]:
        """
        Delete a file or directory at the given path
        
        Args:
            path: Path to the file or directory to delete
            
        Returns:
            Dict containing deletion result
        """
        try:
            path = Path(path)
            
            if not path.exists():
                error_msg = f"Path does not exist: {path}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
            
            if path.is_file():
                # Delete file
                path.unlink()
                logger.info(f"Deleted file: {path}")
                return {
                    'success': True,
                    'deleted_type': 'file',
                    'deleted_path': str(path)
                }
                
            elif path.is_dir():
                # Delete directory and all contents
                shutil.rmtree(path)
                logger.info(f"Deleted directory: {path}")
                return {
                    'success': True,
                    'deleted_type': 'directory',
                    'deleted_path': str(path)
                }
            else:
                error_msg = f"Path is neither file nor directory: {path}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except PermissionError as e:
            error_msg = f"Permission denied: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
            
        except OSError as e:
            error_msg = f"OS error: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
            
        except Exception as e:
            error_msg = f"Unexpected error deleting path: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }

# Create singleton instance
basic_utils = BasicUtils()

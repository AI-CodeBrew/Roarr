"""
Auth Service: Business logic for authentication and user management
"""
import logging
from ..database import document_store

logger = logging.getLogger(__name__)

class AuthService:
    """Service class for authentication and user management operations"""
    
    @staticmethod
    def assign_user_id(user_info):
        """
        Assign Cognito user ID and create user profile if not exists.
        
        Args:
            user_info: Dictionary containing user attributes from token
            
        Returns:
            dict: Response with success status and user information
        """
        try:
            cognito_user_id = user_info.get('sub')
            
            # Fallback: If sub is not in user_info, try other methods
            if not cognito_user_id:
                # This should be handled by the caller, but we check here too
                return {
                    'success': False,
                    'error': 'Could not extract Cognito user ID from token'
                }
            
            email = user_info.get('email')
            given_name = user_info.get('given_name', '')
            family_name = user_info.get('family_name', '')
            
            # Check if user already exists
            user = document_store.get_user_by_cognito_id(cognito_user_id)
            if user:
                return {
                    'success': True,
                    'message': 'User already exists',
                    'is_new_user': False,
                }
            
            # Create new user entry in DynamoDB using Cognito ID as PK
            document_store.create_user(
                cognito_user_id=cognito_user_id,
                email=email,
                first_name=given_name,
                last_name=family_name
            )
            
            return {
                'success': True,
                'message': 'User ID assigned successfully',
                'is_new_user': True
            }
        except Exception as e:
            logger.error(f"Error in assign_user_id service: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def logout(user_id):
        """
        Handle user logout.
        
        Args:
            user_id: The user's Cognito ID
            
        Returns:
            dict: Response with success status
        """
        try:
            # No actual logout logic needed (stateless JWT), just return success
            return {'success': True}
        except Exception as e:
            logger.error(f"Error during logout: {e}")
            return {
                'success': False,
                'error': str(e)
            }


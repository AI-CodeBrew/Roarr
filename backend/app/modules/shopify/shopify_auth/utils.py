"""
Shopify Auth Utils: Utilities for Shopify OAuth data encryption/decryption
"""
import base64
import json
import hmac
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

SHOPIFY_APP_SECRET = os.getenv("SHOPIFY_APP_SECRET").encode("utf-8")  # ✅ convert to bytes

def verify_signature(body: bytes, received_sig: str) -> bool:
    expected_sig = hmac.new(
        SHOPIFY_APP_SECRET,  # now bytes
        body,                # already bytes from request.data
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_sig, received_sig)


def decrypt_shopify_oauth_data(encoded_data: str) -> dict:
    """
    Decrypt base64 encoded Shopify OAuth data
    
    Args:
        encoded_data: Base64 encoded JSON string containing shop_url and access_token
        
    Returns:
        Dict with shop_url and access_token
        
    Raises:
        ValueError: If data is invalid or missing required fields
    """
    try:
        decoded_bytes = base64.b64decode(encoded_data)
        decoded_string = decoded_bytes.decode('utf-8')
  
        data = json.loads(decoded_string)
        
        if 'shop_url' not in data or 'access_token' not in data:
            raise ValueError("Missing required fields: shop_url and access_token")
            
        return {
            'shop_url': data['shop_url'],
            'access_token': data['access_token']
        }
        
    except base64.binascii.Error as e:
        raise ValueError("Invalid base64 encoded data")
    except json.JSONDecodeError as e:
        raise ValueError("Invalid JSON data")
    except Exception as e:
        raise ValueError("Failed to decrypt OAuth data")

def encode_shopify_oauth_data(shop_url: str, access_token: str) -> str:
    """
    Encode Shopify OAuth data to base64
    
    Args:
        shop_url: Shopify store URL
        access_token: Shopify access token
        
    Returns:
        Base64 encoded JSON string
    """
    data = {
        'shop_url': shop_url,
        'access_token': access_token
    }
    
    json_string = json.dumps(data)
    encoded_bytes = json_string.encode('utf-8')
    encoded_data = base64.b64encode(encoded_bytes).decode('utf-8')
    
    return encoded_data


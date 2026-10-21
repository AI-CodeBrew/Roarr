"""
Translation Utility Module
Translates product title and description to English if needed.
"""

from typing import Union, List
from pydantic import BaseModel, Field
from ...clients import openai_client as client


class LanguageCheck(BaseModel):
    """Schema for language detection"""
    is_english: bool = Field(description="True if the text is in English, False otherwise")


class TranslatedText(BaseModel):
    """Schema for translated text"""
    translated_text: str = Field(
        description="The text translated to English while preserving all brand names, model numbers, technical specifications, measurements, and formatting exactly as they appear in the original"
    )


class TranslatedList(BaseModel):
    """Schema for translated list of strings"""
    translated_items: List[str] = Field(
        description="List of texts translated to English while preserving all brand names, model numbers, technical specifications, measurements, and original structure"
    )


def check_language(text: str) -> bool:
    """
    Check if text is in English.
    
    Args:
        text: Text to check (sample from list if it's a list)
    
    Returns:
        True if English, False otherwise
    """
    if not text or not text.strip():
        return True
    
    # Use small sample for efficiency
    sample = text[:300] if len(text) > 300 else text
    
    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a language detector. Determine if the text is in English or not."
                },
                {
                    "role": "user",
                    "content": f"Is this text in English?\n\n{sample}"
                }
            ],
            response_format=LanguageCheck,
            temperature=0.1
        )
        
        return completion.choices[0].message.parsed.is_english
    
    except Exception as e:
        print(f"Language check error: {str(e)}, assuming English")
        return True


def translate_to_english(text: Union[str, List[str]]) -> Union[str, List[str]]:
    """
    Translate text to English.
    
    Args:
        text: String or list of strings to translate
    
    Returns:
        Translated text (same type as input)
    """
    if not text:
        return text
    
    try:
        # Handle list of strings (description bullet points)
        if isinstance(text, list):
            if not text:
                return text
            
            bullet_text = "\n".join([f"- {item}" for item in text])
            
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a professional translator specializing in product information. "
                            "Translate the text to English while strictly preserving:\n"
                            "- All brand names exactly as written\n"
                            "- Model numbers, SKUs, and product codes\n"
                            "- Technical specifications and measurements\n"
                            "- Formatting, line breaks, and bullet points\n"
                            "- Numbers, dimensions, and units\n"
                            "Keep the same sentence structure and style. Only translate the language, not the content."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Translate these bullet points to English:\n\n{bullet_text}"
                    }
                ],
                response_format=TranslatedList,
                temperature=0.1
            )
            
            return completion.choices[0].message.parsed.translated_items
        
        # Handle single string (title or description)
        else:
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a professional translator specializing in product information. "
                            "Translate the text to English while strictly preserving:\n"
                            "- All brand names exactly as written\n"
                            "- Model numbers, SKUs, and product codes\n"
                            "- Technical specifications and measurements\n"
                            "- Formatting and structure\n"
                            "- Numbers, dimensions, and units\n"
                            "Keep the same sentence structure and style. Only translate the language, not the content."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Translate this text to English:\n\n{text}"
                    }
                ],
                response_format=TranslatedText,
                temperature=0.1
            )
            
            return completion.choices[0].message.parsed.translated_text
    
    except Exception as e:
        print(f"Translation error: {str(e)}, using original text")
        return text


def ensure_english_product_data(product_data: dict) -> dict:
    """
    Ensure product title and description are in English.
    
    Args:
        product_data: Dictionary with 'title' and 'description' fields
    
    Returns:
        Product data with English text
    """
    if not product_data:
        return product_data
    
    translated_data = product_data.copy()
    
    # Check and translate title if needed
    if 'title' in translated_data and translated_data['title']:
        is_english = check_language(translated_data['title'])
        if is_english:
            print("Title is in English")
        else:
            print("Title is not English, translating...")
            translated_data['title'] = translate_to_english(translated_data['title'])
    
    # Check and translate description if needed
    if 'description' in translated_data and translated_data['description']:
        # For lists, check first item
        sample_text = translated_data['description'][0] if isinstance(translated_data['description'], list) and translated_data['description'] else translated_data['description']
        is_english = check_language(sample_text)
        if is_english:
            print("Description is in English")
        else:
            print("Description is not English, translating...")
            translated_data['description'] = translate_to_english(translated_data['description'])
    
    return translated_data


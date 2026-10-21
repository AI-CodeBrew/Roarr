"""
Gemini Client — lazy init; missing key does not crash import (v2).
"""
import os
from google import genai

gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if gemini_api_key:
    client = genai.Client(api_key=gemini_api_key)
else:
    client = None
    print("WARNING: GEMINI_API_KEY / GOOGLE_API_KEY not set — Gemini client is None")

"""
OpenAI Client — lazy init; missing key does not crash import (v2).
"""
import os
from openai import OpenAI

openai_api_key = os.getenv("OPENAI_API_KEY")

if openai_api_key:
    client = OpenAI(api_key=openai_api_key)
else:
    client = None
    print("WARNING: OPENAI_API_KEY not set — OpenAI client is None")

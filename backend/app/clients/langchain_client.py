"""
LangChain Client — optional when OPENAI_API_KEY is missing (v2).
"""
import os

openai_api_key = os.getenv("OPENAI_API_KEY")

if openai_api_key:
    from langchain_openai import ChatOpenAI

    # Name kept from when this ran gpt-4.1-nano, which OpenAI has shut down (404 model_not_found).
    # Text generation now runs OPENAI_TEXT_MODEL (default gpt-4o-mini: similar price, same API).
    llm_4_1_nano = ChatOpenAI(
        model=os.getenv("OPENAI_TEXT_MODEL", "gpt-4o-mini"), temperature=1, api_key=openai_api_key
    )
    llm_5_mini_medium = ChatOpenAI(
        model="gpt-5-mini", reasoning_effort="medium", temperature=1
    )
else:
    llm_4_1_nano = None
    llm_5_mini_medium = None
    print("WARNING: OPENAI_API_KEY not set — LangChain LLMs are None")

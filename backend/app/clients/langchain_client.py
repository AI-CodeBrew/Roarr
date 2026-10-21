"""
LangChain Client — optional when OPENAI_API_KEY is missing (v2).
"""
import os

openai_api_key = os.getenv("OPENAI_API_KEY")

if openai_api_key:
    from langchain_openai import ChatOpenAI

    llm_4_1_nano = ChatOpenAI(
        model="gpt-4.1-nano", temperature=1, api_key=openai_api_key
    )
    llm_5_mini_medium = ChatOpenAI(
        model="gpt-5-mini", reasoning_effort="medium", temperature=1
    )
else:
    llm_4_1_nano = None
    llm_5_mini_medium = None
    print("WARNING: OPENAI_API_KEY not set — LangChain LLMs are None")

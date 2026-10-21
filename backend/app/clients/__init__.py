"""
Clients Module — lazy exports so missing API keys do not crash import.
"""


def __getattr__(name):
    if name == "openai_client":
        from .openai_client import client

        return client
    if name == "gemini_client":
        from .gemini_client import client

        return client
    if name == "llm_4_1_nano":
        from .langchain_client import llm_4_1_nano

        return llm_4_1_nano
    if name == "posthog_client":
        from .posthog_client import posthog_client

        return posthog_client
    if name == "bunny_client":
        from .bunny_client import bunny_client

        return bunny_client
    raise AttributeError(name)


__all__ = [
    "openai_client",
    "gemini_client",
    "llm_4_1_nano",
    "posthog_client",
    "bunny_client",
]

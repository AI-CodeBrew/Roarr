"""
PostHog client — no-op in v2 unless PUBLIC_POSTHOG_KEY is set.
"""
import logging
import os

logger = logging.getLogger(__name__)

posthog_api_key = os.getenv("PUBLIC_POSTHOG_KEY")
posthog_host = os.getenv("PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com")


class _NoOpPosthog:
    def capture(self, *args, **kwargs):
        return None

    def set(self, *args, **kwargs):
        return None

    def set_once(self, *args, **kwargs):
        return None

    def identify(self, *args, **kwargs):
        return None

    def flush(self, *args, **kwargs):
        return None


if posthog_api_key:
    try:
        from posthog import Posthog

        posthog_client = Posthog(posthog_api_key, host=posthog_host)
    except Exception as e:
        logger.warning("PostHog init failed; using no-op: %s", e)
        posthog_client = _NoOpPosthog()
else:
    posthog_client = _NoOpPosthog()

"""
Crisp client — no-op in v2 unless CRISP_* env vars are set.
"""
import os
import logging

CRISP_IDENTIFIER = os.getenv("CRISP_IDENTIFIER")
CRISP_KEY = os.getenv("CRISP_KEY")
CRISP_WEBSITE_ID = os.getenv("CRISP_WEBSITE_ID")

logger = logging.getLogger(__name__)


class CrispClient:
    def __init__(self):
        self.enabled = bool(CRISP_IDENTIFIER and CRISP_KEY and CRISP_WEBSITE_ID)
        self.crisp = None
        if self.enabled:
            try:
                from crisp_api import Crisp

                self.crisp = Crisp()
                self.crisp.set_tier("plugin")
                self.crisp.authenticate(CRISP_IDENTIFIER, CRISP_KEY)
            except Exception as e:
                logger.warning("Crisp init failed; running as no-op: %s", e)
                self.enabled = False

    def add_new_user_profile(self, user_data):
        if not self.enabled:
            return False
        try:
            return self.crisp.website.add_new_people_profile(
                CRISP_WEBSITE_ID, user_data
            )
        except Exception as e:
            logger.error(f"Error adding user profile: {str(e)}")
            return False

    def get_user_profile(self, people_id=None, email=None):
        if not self.enabled:
            return False
        try:
            if not people_id and not email:
                return False
            target = people_id or email
            return self.crisp.website.get_people_profile(CRISP_WEBSITE_ID, target)
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return False

    def search_users_profile(self, search_text):
        if not self.enabled:
            return False
        try:
            if search_text and isinstance(search_text, str) and search_text.endswith(
                ".myshopify.com"
            ):
                search_text = search_text[: -len(".myshopify.com")]
            return self.crisp.website.parent.get(
                f"/website/{CRISP_WEBSITE_ID}/people/profiles/0?search_text={search_text}"
            )
        except Exception as e:
            logger.error(f"Error searching user profiles: {str(e)}")
            return False

    def send_event(self, people_id, event_data):
        if not self.enabled:
            return False
        try:
            return self.crisp.website.add_people_event(
                CRISP_WEBSITE_ID, people_id, event_data
            )
        except Exception as e:
            logger.error(f"Error sending event: {str(e)}")
            return False


crisp_client = CrispClient()

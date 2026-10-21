import { createContext, useContext } from "react";
import { usePostHog } from "posthog-js/react";

const PosthogIdentityContext = createContext(false);

export function PosthogIdentityProvider({ children, identified }) {
  return (
    <PosthogIdentityContext.Provider value={!!identified}>
      {children}
    </PosthogIdentityContext.Provider>
  );
}

/** True after `posthog.identify` has run in the app shell (shop + shop details). */
export function usePosthogIdentified() {
  return useContext(PosthogIdentityContext);
}

/**
 * Same as usePostHog but returns null until the app has identified the shop.
 * Use this for capture, setPersonProperties, and other analytics that must attach to the identified user.
 */
export function usePosthogAfterIdentify() {
  const posthog = usePostHog();
  const identified = usePosthogIdentified();
  if (!identified || !posthog) return null;
  return posthog;
}

import { useState, useEffect } from "react";

/**
 * Renders children immediately and mounts PostHogProvider only after the browser
 * is idle (or after a timeout). This improves LCP by not blocking first paint
 * with analytics initialization.
 */
export default function DeferredPostHogProvider({
  apiKey,
  options,
  children,
}) {
  const [Provider, setProvider] = useState(null);
  const [providerProps, setProviderProps] = useState(null);

  useEffect(() => {
    if (!apiKey) return;

    const schedule = () => {
      import("posthog-js/react").then(({ PostHogProvider: PH }) => {
        setProvider(() => PH);
        setProviderProps({ apiKey, options });
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(schedule, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(schedule, 2500);
    return () => clearTimeout(t);
  }, [apiKey]);

  if (Provider && providerProps) {
    return (
      <Provider apiKey={providerProps.apiKey} options={providerProps.options}>
        {children}
      </Provider>
    );
  }

  return children;
}

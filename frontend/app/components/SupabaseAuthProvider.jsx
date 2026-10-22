/**
 * Optional Supabase Auth context for v2.
 * Mount when SUPABASE_URL + SUPABASE_ANON_KEY are present.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getSupabaseBrowserClient,
  getSupabaseAccessToken,
} from "../lib/supabase.client";

const SupabaseAuthContext = createContext({
  supabase: null,
  session: null,
  accessToken: null,
  ready: false,
});

export function SupabaseAuthProvider({ url, anonKey, children }) {
  // *.client modules are stubbed out in the server build, so only create the
  // browser client once we're actually in the browser.
  const supabase = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : getSupabaseBrowserClient(url, anonKey),
    [url, anonKey],
  );
  const [session, setSession] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session || null);
      setAccessToken(data.session?.access_token || null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAccessToken(next?.access_token || null);
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, session, accessToken, ready, getSupabaseAccessToken }),
    [supabase, session, accessToken, ready],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}

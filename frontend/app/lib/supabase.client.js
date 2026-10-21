/**
 * Browser Supabase client (v2 Auth).
 * Only initializes when SUPABASE_URL + SUPABASE_ANON_KEY are present.
 */
import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseBrowserClient(url, anonKey) {
  if (!url || !anonKey) return null;
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

/**
 * Return the current Supabase access token for Python API Authorization headers.
 */
export async function getSupabaseAccessToken(supabase) {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

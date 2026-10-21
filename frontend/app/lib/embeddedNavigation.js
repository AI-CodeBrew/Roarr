/**
 * Shopify appends these to the admin → embedded iframe URL on the very first load.
 * Once App Bridge has initialized in memory, they are not needed in the URL anymore
 * and we strip them so in-app navigation uses clean paths.
 *
 * We deliberately do NOT propagate `host`, `shop`, `id_token`, `embedded`, etc. to
 * client-side navigation links — App Bridge already has that context in memory and
 * the parent `_app.jsx` loader is the only place that needs `shop`, which it reads
 * from the initial URL before this cleanup runs.
 */
const STRIP_SHOPIFY_EPHEMERAL = new Set([
  "hmac",
  "timestamp",
  "embedded",
  "host",
  "id_token",
  "session",
  "locale",
]);

/**
 * @param {string} search — `location.search` (leading `?` optional)
 * @returns {{ search: string, changed: boolean }} `search` is suitable for `navigate({ search })` (includes `?` when non-empty)
 */
export function stripShopifyEphemeralFromSearch(search) {
  if (!search || search === "?") {
    return { search: "", changed: false };
  }
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(raw);
  let changed = false;
  const out = new URLSearchParams();
  for (const [k, v] of sp.entries()) {
    if (STRIP_SHOPIFY_EPHEMERAL.has(k)) {
      changed = true;
      continue;
    }
    out.append(k, v);
  }
  if (!changed) {
    return { search, changed: false };
  }
  const qs = out.toString();
  return { search: qs ? `?${qs}` : "", changed: true };
}

/**
 * Build a clean search string for embedded top-level navigation.
 *
 * In-app navigation is a client-side React Router pushState, so no server
 * round-trip happens and no Shopify query params are required. We return
 * an empty search so nav links look like `/product-page`, `/credits`, etc.
 *
 * Signature kept for backwards compatibility with existing callers.
 *
 * @param {URLSearchParams} _searchParams
 * @param {string | null | undefined} _shopFromLoader
 * @returns {string} always "" for top-nav
 */
export function buildEmbeddedSearch(_searchParams, _shopFromLoader) {
  return "";
}

/**
 * Build an in-app href with only the explicit `extra` params. Existing search
 * params are intentionally dropped so stale state (flow, pageId, host, shop,
 * id_token, …) does not leak across pages.
 *
 * @param {string} pathname
 * @param {URLSearchParams} _searchParams — ignored (kept for signature compatibility)
 * @param {string | null | undefined} _shopFromLoader — ignored
 * @param {Record<string, string | number | boolean | null | undefined>} [extra]
 */
export function buildEmbeddedHref(pathname, _searchParams, _shopFromLoader, extra = {}) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value != null && value !== "") {
      out.set(key, String(value));
    }
  }
  const s = out.toString();
  return s ? `${pathname}?${s}` : pathname;
}

/**
 * Fetch a same-origin `/api/*` route with a fresh Shopify session token.
 * Session JWTs expire in about a minute. Long generation polls must mint a new
 * token per request, and a 401 must wait briefly so App Bridge can issue
 * another one instead of failing the run.
 *
 * @param {{ idToken: () => Promise<string> }} shopify — App Bridge from useAppBridge()
 * @param {string} url
 * @param {RequestInit} [options]
 */
const AUTH_RETRY_ATTEMPTS = 4;
const AUTH_RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function shopifyAuthenticatedFetch(shopify, url, options = {}) {
  const buildHeaders = async () => {
    const headers = new Headers(options.headers || {});
    if (shopify?.idToken) {
      const token = await shopify.idToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  let response;
  for (let attempt = 0; attempt < AUTH_RETRY_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(url, {
        ...options,
        headers: await buildHeaders(),
      });
    } catch (error) {
      if (attempt === AUTH_RETRY_ATTEMPTS - 1) throw error;
      await sleep(AUTH_RETRY_DELAY_MS);
      continue;
    }

    const canRetryAuth = response.status === 401 && shopify?.idToken;
    if (!canRetryAuth || attempt === AUTH_RETRY_ATTEMPTS - 1) {
      return response;
    }
    await sleep(AUTH_RETRY_DELAY_MS);
  }

  return response;
}

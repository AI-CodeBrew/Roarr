/**
 * Credit pack pricing uses one global catalog (backend defaults).
 * Country detection is intentionally disabled — no per-region price overrides.
 */

/**
 * @param {Request} _request
 * @returns {Headers} Empty — no pricing country forwarded to Python API.
 */
export function pricingHeadersForPython(_request) {
  return new Headers();
}

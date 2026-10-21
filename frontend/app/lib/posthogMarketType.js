export function normalizeMarketType(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "cod" || v === "prepaid" ? v : null;
}

/** Stick COD/prepaid on this shop so later events (pages, credits, funnels) can be filtered. */
export function syncPosthogMarketType(posthog, value) {
  const marketType = normalizeMarketType(value);
  if (!posthog || !marketType) return marketType;
  posthog.register({ market_type: marketType });
  try {
    posthog.setPersonProperties({ market_type: marketType });
  } catch {
    // identify may not have run yet
  }
  return marketType;
}

import crypto from "crypto";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function checkIsOnboarded(shop) {
  try {
    const payload = { shop, timestamp: new Date().toISOString() };
    const signature = signPayload(payload);
    const res = await fetch(`${PYTHON_API_URL}/api/shopify/is-store-onboarded`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shop-Domain": shop,
        "X-Internal-Signature": signature,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return !!(data?.success && data?.is_onboarded);
  } catch (error) {
    console.error("Error checking if store is onboarded", error);
    return false;
  }
}

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return Response.json(
        { error: "Shop parameter is required", isOnboarded: false },
        { status: 400 }
      );
    }

    const isOnboarded = await checkIsOnboarded(shop);

    return Response.json({ isOnboarded }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return Response.json(
      { error: "Failed to fetch onboarding status", isOnboarded: false },
      { status: 500 }
    );
  }
};

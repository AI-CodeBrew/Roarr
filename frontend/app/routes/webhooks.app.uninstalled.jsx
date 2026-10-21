import { authenticate } from "../shopify.server";
import db from "../db.server";
import crypto from "crypto";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function signPayload(payload) {
  return crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

  // 🔐 Notify Python backend
  export const action = async ({ request }) => {
    const { shop, session, topic } = await authenticate.webhook(request);
    
    console.log(`Received ${topic} webhook for ${shop}`);
  
    // We don't update shop metafields here: the access token is invalidated during uninstall.
  
    if (session) {
      await db.session.deleteMany({ where: { shop } });
    }
  
    // 🔐 Notify Python backend
    const payload = {
      event: "uninstall",
      shop,
      timestamp: Date.now(),
    };
  
    const signature = signPayload(payload);
  
    await fetch(`${PYTHON_API_URL}/api/app/uninstall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Signature": signature,
      },
      body: JSON.stringify(payload),
    });
  
    return new Response("OK");
  };
  
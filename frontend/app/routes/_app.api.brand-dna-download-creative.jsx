import { authenticate } from "../shopify.server";

const UPSTREAM_TIMEOUT_MS = 60_000;
const MAX_IMAGE_BYTES = 40 * 1024 * 1024;

function sanitizeFilename(name) {
  const base = String(name || "brand-ad-creative.png")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 180);
  return base || "brand-ad-creative.png";
}

function isIpLiteral(hostname) {
  if (!hostname) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  return hostname.includes(":"); // IPv6 or bracketed
}

function isAllowedCreativeSourceUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (isIpLiteral(host)) return false;
  if (host === "localhost" || host.endsWith(".local")) return false;
  // Brand creatives are stored on S3 / CloudFront-style CDNs.
  if (host.endsWith(".amazonaws.com") || host.endsWith(".cloudfront.net")) {
    return true;
  }
  return false;
}

/**
 * Stream a public creative image through the app so the browser saves it
 * (avoids cross-origin <a download> + CORS issues with direct S3 fetch).
 * POST /api/brand-dna-download-creative
 */
export async function action({ request }) {
  try {
    await authenticate.admin(request);

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body?.url === "string" ? body.url.trim() : "";
    const filename = sanitizeFilename(body?.filename);

    if (!imageUrl || !isAllowedCreativeSourceUrl(imageUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or disallowed image URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstream;
    try {
      upstream = await fetch(imageUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Image request failed (${upstream.status})`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const lenHeader = upstream.headers.get("content-length");
    if (lenHeader) {
      const n = Number(lenHeader);
      if (Number.isFinite(n) && n > MAX_IMAGE_BYTES) {
        return new Response(
          JSON.stringify({ success: false, error: "Image too large" }),
          { status: 413, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: "Image too large" }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }

    const mime =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
      "application/octet-stream";

    const quoted = JSON.stringify(filename);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename=${quoted}`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    console.error(`Error downloading brand creative image:`, err?.message || err);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          err?.name === "AbortError"
            ? "Timed out fetching image"
            : err?.message || "Download failed",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

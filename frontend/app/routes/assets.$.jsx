import path from "path";

// app/assets goes through the build (hashed URLs, or inlined data: URLs for tiny files) because a
// serverless host does not ship the folder, so reading it from disk gave a 404 there.
const bundledAssets = import.meta.glob("../assets/*", { query: "?url", import: "default", eager: true });
const assetUrls = Object.fromEntries(
    Object.entries(bundledAssets).map(([file, url]) => [file.replace("../assets/", ""), url]),
);

const MIME_TYPES = {
    ".svg": "image/svg+xml",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
};

/**
 * Serves files from app/assets at /assets/* so Liquid preview (asset_url) resolves.
 * e.g. GET /assets/kids_toys_1.svg → app/assets/kids_toys_1.svg
 */
export async function loader({ params, request }) {
    const filename = params["*"] || "";
    if (!filename) {
        return new Response("Not Found", { status: 404 });
    }
    // Prevent path traversal: only allow a single path segment (no slashes)
    if (filename.includes("/") || filename.includes("..")) {
        return new Response("Forbidden", { status: 403 });
    }
    const url = assetUrls[filename];
    if (!url) return new Response("Not Found", { status: 404 });

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const headers = { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" };

    // Small files are inlined by the build as data: URLs, which cannot be redirected to.
    if (url.startsWith("data:")) {
        const comma = url.indexOf(",");
        const isBase64 = url.slice(0, comma).includes(";base64");
        const payload = url.slice(comma + 1);
        const body = isBase64 ? Buffer.from(payload, "base64") : decodeURIComponent(payload);
        return new Response(body, { status: 200, headers });
    }
    return Response.redirect(new URL(url, request.url).toString(), 302);
}

import path from "path";
import fs from "fs";
import { getAssetDir } from "../utils/assets.server";

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
export async function loader({ params }) {
    const filename = params["*"] || "";
    if (!filename) {
        return new Response("Not Found", { status: 404 });
    }
    // Prevent path traversal: only allow a single path segment (no slashes)
    if (filename.includes("/") || filename.includes("..")) {
        return new Response("Forbidden", { status: 403 });
    }
    const assetsDir = path.resolve(getAssetDir());
    const filePath = path.resolve(assetsDir, filename);
    if (!filePath.startsWith(assetsDir + path.sep) && filePath !== assetsDir) {
        return new Response("Forbidden", { status: 403 });
    }
    try {
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        return new Response(buf, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (err) {
        if (err.code === "ENOENT") return new Response("Not Found", { status: 404 });
        return new Response("Internal Server Error", { status: 500 });
    }
}

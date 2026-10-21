import path from "path";

/**
 * Resolves the app assets directory (app/assets) for serving static files.
 * Used by the /assets/* route so Liquid asset_url (e.g. /assets/kids_toys_1.svg) resolves.
 */
export function getAssetDir() {
    return path.resolve(process.cwd(), "app", "assets");
}

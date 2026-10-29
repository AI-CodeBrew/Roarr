#!/usr/bin/env node
/**
 * liquid-to-app.mjs
 *
 * Converts a Shopify extension Liquid file into:
 * 1. A simplified Liquid template for app/liquid/ (no schema, preview-ready)
 * 2. Block settings object (from schema)
 * 3. Product metafields object (from product.metafields.roarr references)
 *
 * Usage:
 *   node scripts/liquid-to-app.mjs <liquid-file-name>
 *   node scripts/liquid-to-app.mjs before-after
 *   node scripts/liquid-to-app.mjs extensions/pdpbuilder/blocks/before-after.liquid
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SCHEMA_RE = /\{%\s*schema\s*%\}\s*([\s\S]*?)\s*\{%\s*endschema\s*%\}/i;
const BLOCK_SETTINGS_RE = /block\.settings\.(\w+)|s\.(\w+)(?=\s*[|\s,})])/g;
const PRODUCT_METAFIELD_RE = /product\.metafields\.roarr\.(\w+)/g;
const PRODUCT_METAFIELD_DYNAMIC_RE = /product\.metafields\.roarr\[[\w\s'"]+\]/g;
const SHOP_METAFIELD_RE = /shop\.metafields\.app\.(\w+)/g;

/** Default value by schema type */
function getDefaultForType(schemaType, defaultVal) {
    if (defaultVal !== undefined) return defaultVal;
    switch (schemaType) {
        case "checkbox":
            return false;
        case "image_picker":
            return "";
        case "text":
        case "textarea":
        case "url":
        case "color":
            return "";
        case "number":
        case "range":
            return 0;
        default:
            return "";
    }
}

/** Extract schema JSON from Liquid content */
function extractSchema(liquidContent) {
    const match = liquidContent.match(SCHEMA_RE);
    if (!match) return null;
    try {
        return JSON.parse(match[1].trim());
    } catch {
        return null;
    }
}

/** Build block settings object from schema */
function buildBlockSettings(schema) {
    if (!schema?.settings?.length) return {};
    const settings = {};
    for (const item of schema.settings) {
        if (item.type === "header" || !item.id) continue;
        settings[item.id] = getDefaultForType(item.type, item.default);
    }
    return settings;
}

/** Extract product.metafields.roarr keys from Liquid */
function extractProductMetafields(liquidContent) {
    const keys = new Set();
    let m;
    const re = new RegExp(PRODUCT_METAFIELD_RE.source, "g");
    while ((m = re.exec(liquidContent))) keys.add(m[1]);

    // Handle dynamic keys like product.metafields.roarr['happy_customer_image_' | append: i]
    const dynamicMatch = liquidContent.match(/assign\s+meta_key\s*=\s*['"]([^'"]+)['"]/);
    if (dynamicMatch) {
        const prefix = dynamicMatch[1];
        const forMatch = liquidContent.match(/for\s+i\s+in\s+\((\d+)\.\.(\d+)\)/);
        if (forMatch) {
            const start = parseInt(forMatch[1], 10);
            const end = parseInt(forMatch[2], 10);
            for (let i = start; i <= end; i++) keys.add(`${prefix}${i}`);
        }
    }

    return [...keys];
}

/** Generate product metafields object with placeholders */
function buildProductMetafields(keys, placeholderImage) {
    const metafields = {};
    const imageUrl = placeholderImage || "https://via.placeholder.com/600x600";

    for (const key of keys) {
        const lower = key.toLowerCase();
        if (lower.includes("image") || lower.includes("picture") || lower.includes("photo")) {
            metafields[key] = {
                value: {
                    src: imageUrl,
                    width: 600,
                    height: 600
                }
            };
        } else if (
            lower.includes("color") ||
            lower.includes("schema")
        ) {
            metafields[key] = { value: "#E8A798" };
        } else {
            metafields[key] = { value: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
        }
    }

    return metafields;
}

/** Strip schema block from Liquid */
function stripSchema(liquidContent) {
    return liquidContent.replace(SCHEMA_RE, "").trim();
}

/** Simplify Liquid for app preview (strip schema, show by default) */
function simplifyLiquidForApp(liquidContent) {
    let out = stripSchema(liquidContent);

    // Remove display:none so app preview shows the block
    out = out.replace(/style="([^"]*display:\s*none[^"]*)"/gi, (_, inner) => {
        const cleaned = inner.replace(/display:\s*none;?\s*/gi, "").trim();
        return `style="${cleaned || "display:block"}"`;
    });

    return out;
}

/** Find liquid file path */
function resolveLiquidPath(input) {
    const base = input.replace(/\.liquid$/, "");
    const candidates = [
        path.join(ROOT, "extensions/pdpbuilder/blocks", `${base}.liquid`),
        path.join(ROOT, "extensions/pdpbuilder/blocks", `${input}.liquid`),
        path.join(ROOT, input),
        path.join(ROOT, `${input}.liquid`)
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/** Format as valid JS for copy-paste into app.liquid.jsx */
function toJsBlock(blockId, settings) {
    const s = JSON.stringify(settings, null, 2);
    const indented = s.replace(/^/gm, "  ");
    return `const BLOCK = {
  id: "${blockId}",
  settings: ${indented}
};`;
}

function toJsProduct(metafields) {
    const s = JSON.stringify({ roarr: metafields }, null, 2);
    return `const PRODUCT = {
  metafields: ${s.replace(/^/gm, "  ")}
};`;
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("-n");
const input = args.find((a) => !a.startsWith("-"));

if (!input) {
    console.error("Usage: node scripts/liquid-to-app.mjs <liquid-file-name> [--dry-run]");
    console.error("  e.g. node scripts/liquid-to-app.mjs before-after");
    console.error("  e.g. node scripts/liquid-to-app.mjs extensions/pdpbuilder/blocks/image-with-text.liquid --dry-run");
    process.exit(1);
}

const liquidPath = resolveLiquidPath(input);
if (!liquidPath) {
    console.error("Could not find Liquid file for:", input);
    process.exit(1);
}

const templateName = path.basename(liquidPath, ".liquid");
const outLiquidPath = path.join(ROOT, "app/liquid", `${templateName}.liquid`);

console.log("Input:", liquidPath);
console.log("Output template:", outLiquidPath);
console.log("---\n");

const raw = fs.readFileSync(liquidPath, "utf8");

// 1. Schema → block settings
const schema = extractSchema(raw);
const blockSettings = schema ? buildBlockSettings(schema) : {};
const blockId = `${templateName.replace(/-/g, "_")}_1`;
const block = {
    id: blockId,
    settings: blockSettings
};

// 2. Product metafields from Liquid
const metafieldKeys = extractProductMetafields(raw);
const productMetafields = buildProductMetafields(metafieldKeys);
const product = {
    metafields: {
        roarr: productMetafields
    }
};

// 3. Simplified Liquid
const simplifiedLiquid = simplifyLiquidForApp(raw);

// Write files unless --dry-run
const appLiquidDir = path.join(ROOT, "app/liquid");
if (!dryRun) {
    if (!fs.existsSync(appLiquidDir)) {
        fs.mkdirSync(appLiquidDir, { recursive: true });
    }
    fs.writeFileSync(outLiquidPath, simplifiedLiquid + "\n", "utf8");
    console.log("✓ Wrote simplified Liquid to", outLiquidPath);
} else {
    console.log("[dry-run] Would write to", outLiquidPath);
}

// 4. Print block and product objects
console.log("\n--- Block (pass as block) ---\n");
console.log(toJsBlock(blockId, blockSettings));

console.log("\n--- Product (pass as product) ---\n");
console.log(toJsProduct(productMetafields));

// 5. Write context JSON (unless --dry-run)
const contextsPath = path.join(ROOT, "app/liquid", `${templateName}.context.json`);
const fullContext = { block, product, shop: { metafields: { app: { block_control: { value: true } } } } };
if (!dryRun) {
    fs.writeFileSync(contextsPath, JSON.stringify(fullContext, null, 2), "utf8");
    console.log("\n✓ Wrote context to", contextsPath);
} else {
    console.log("\n[dry-run] Would write context to", contextsPath);
}

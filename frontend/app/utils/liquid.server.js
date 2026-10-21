import { Liquid } from "liquidjs";
import path from "path";

export const engine = new Liquid({
    root: path.resolve("app/liquid"),
    extname: ".liquid",
    // Always re-read templates so CSS/layout edits show in demo preview without a full restart.
    cache: false,
    strictFilters: false,
    strictVariables: false
});

/** Escape for double-quoted HTML attributes on preview section wrappers. */
function escapeHtmlAttribute(value) {
    if (value == null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
}

function dataLiquidSectionDisplayNameAttr(displayName) {
    if (displayName == null || String(displayName).trim() === "") return "";
    return ` data-liquid-section-display-name="${escapeHtmlAttribute(displayName)}"`;
}

/* -------------------------
   Custom Shopify-like Tags
--------------------------*/

// style - Shopify-style {% style %}...{% endstyle %} → <style>...</style>
engine.registerTag("style", {
    parse(tagToken, remainTokens) {
        this.tpls = [];
        let closed = false;
        while (remainTokens.length) {
            const token = remainTokens.shift();
            if (token.name === "endstyle") {
                closed = true;
                break;
            }
            const tpl = engine.parser.parseToken(token, remainTokens);
            this.tpls.push(tpl);
        }
        if (!closed) throw new Error(`tag ${tagToken.getText()} not closed`);
    },
    *render(context, emitter) {
        emitter.write("<style>");
        yield engine.renderer.renderTemplates(this.tpls, context, emitter);
        emitter.write("</style>");
    }
});

// schema - Shopify section schema is editor-only; ignore in LiquidJS preview
engine.registerTag("schema", {
    parse(tagToken, remainTokens) {
        while (remainTokens.length) {
            const token = remainTokens.shift();
            if (token && token.name === "endschema") break;
        }
    },
    *render() {
        /* no-op */
    },
});

/* -------------------------
   Custom Shopify-like Filters
--------------------------*/

// asset_url → just return local path
engine.registerFilter("asset_url", (value) => {
    return `/assets/${value}`;
});

// image_url → return image src (preview: string URL, { value }, { src }, { preview_image }, or nested)
engine.registerFilter("image_url", (value, options) => {
    const resolved = resolvePreviewImageSrc(value);
    return resolved || "";
});

// img_url (Shopify alias) → same as image_url for preview compatibility
engine.registerFilter("img_url", (value, size) => {
    const resolved = resolvePreviewImageSrc(value);
    return resolved || "";
});

/** Unwrap common Shopify / metafield image shapes to a string URL for preview. */
function resolvePreviewImageSrc(value) {
    let v = value;
    for (let depth = 0; depth < 4 && v != null; depth++) {
        if (typeof v === "string") {
            const t = v.trim();
            return t || "";
        }
        if (typeof v !== "object") return "";
        if (typeof v.src === "string" && v.src.trim()) return v.src.trim();
        if (typeof v.preview_image === "string" && v.preview_image.trim()) return v.preview_image.trim();
        if (v.preview_image && typeof v.preview_image === "object" && typeof v.preview_image.src === "string") {
            const s = v.preview_image.src.trim();
            if (s) return s;
        }
        if (v.value != null) {
            v = v.value;
            continue;
        }
        break;
    }
    return "";
}

// Shopify font handles → Google Font display names (for font_face @import URLs)
const SHOPIFY_FONT_MAP = {
    josefin_sans_n4: "Josefin Sans",
    josefin_sans_n6: "Josefin Sans",
    almarai_n4: "Almarai",
    bodoni_moda_n4: "Bodoni Moda",
    tenor_sans_n4: "Tenor Sans",
    assistant_n4: "Assistant",
    abel_n4: "Abel",
    sans_serif_n4: "Inter",
    work_sans_n5: "Work Sans",
    roboto_n4: "Roboto",
    oswald_n4: "Oswald"
};

// Font display names → Google Fonts API URL format (null = system font, no @import)
const GOOGLE_FONTS = {
    "Josefin Sans": "Josefin+Sans",
    "Almarai": "Almarai",
    "Bodoni Moda": "Bodoni+Moda",
    "Tenor Sans": "Tenor+Sans",
    "Assistant": "Assistant",
    "Abel": "Abel",
    "Inter": "Inter",
    "Work Sans": "Work+Sans",
    "Roboto": "Roboto",
    "Oswald": "Oswald",
    "Poppins": "Poppins",
    "Montserrat": "Montserrat",
    "Playfair Display": "Playfair+Display",
    "Lora": "Lora",
    "Open Sans": "Open+Sans",
    "Nunito": "Nunito",
    "Source Sans 3": "Source+Sans+3",
    "Rajdhani": "Rajdhani",
    "Barlow": "Barlow",
    "Barlow Condensed": "Barlow+Condensed",
    "Dosis": "Dosis",
    "DM Sans": "DM+Sans",
    "Merriweather": "Merriweather",
    "Muli": "Muli",
    "Comfortaa": "Comfortaa",
    "Prompt": "Prompt",
    "Helvetica": null,
    "Arial": null,
    "Georgia": null
};

// font_face → generate @font-face rule or Google Fonts import for Shopify font objects
// Supports: {{ font | font_face: font_display: 'swap' }}
// Handles both string fonts (e.g., "work_sans_n5") and font objects (e.g., { family: "Work Sans", fallback_families: "sans-serif" })
engine.registerFilter("font_face", (value, ...args) => {
    if (!value) return "";
    
    // Handle string fonts (Shopify format like "work_sans_n5")
    let family;
    if (typeof value === "string") {
        family = value;
    } else if (value.family) {
        family = String(value.family);
    } else {
        return "";
    }
    
    // Extract font_display from args (LiquidJS named params come as object or string)
    let display = "swap";
    if (args.length > 0) {
        const lastArg = args[args.length - 1];
        if (typeof lastArg === "object" && lastArg?.font_display) {
            display = lastArg.font_display;
        } else if (typeof lastArg === "string" && lastArg.includes("swap")) {
            display = "swap";
        }
    }
    
    // First, check if it's a Shopify font identifier and convert it
    const shopifyFontName = SHOPIFY_FONT_MAP[family];
    if (shopifyFontName) {
        family = shopifyFontName;
    }
    
    // Check if it's a Google Font
    const googleFontName = GOOGLE_FONTS[family];
    if (googleFontName) {
        // Generate Google Fonts @import
        return `@import url('https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;500;600;700&display=${display}');`;
    }
    
    // For system fonts, no need to load
    if (GOOGLE_FONTS[family] === null) {
        return "";
    }
    
    // Unknown font - try to load from Google Fonts by converting name
    // Convert underscores to spaces, then spaces to +
    const googleFontUrl = family.replace(/_/g, " ").replace(/\s+/g, "+");
    return `@import url('https://fonts.googleapis.com/css2?family=${googleFontUrl}:wght@400;500;600;700&display=${display}');`;
});

// font_family - convert Shopify font handle to CSS font-family string (e.g. "roboto_n4" -> "Roboto, sans-serif")
engine.registerFilter("font_family", (value, fallback = "sans-serif") => {
    if (!value) return fallback;
    let family = typeof value === "string" ? value : (value.family || value);
    if (!family) return fallback;
    family = String(family);
    const displayName = SHOPIFY_FONT_MAP[family] || family.replace(/_n\d+$/, "").replace(/_/g, " ");
    const titleCase = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
    return `${titleCase}, ${fallback}`;
});

// replace
engine.registerFilter("replace", (input, search, replace) => {
    return String(input).replace(search, replace);
});

// downcase
engine.registerFilter("downcase", (input) => {
    return String(input).toLowerCase();
});

// at_most - clamp to maximum value (Shopify)
engine.registerFilter("at_most", (input, limit) => {
    const val = Number(input);
    const lim = Number(limit);
    if (Number.isNaN(val) || Number.isNaN(lim)) return input;
    return Math.min(val, lim);
});

// at_least - clamp to minimum value (Shopify)
engine.registerFilter("at_least", (input, limit) => {
    const val = Number(input);
    const lim = Number(limit);
    if (Number.isNaN(val) || Number.isNaN(lim)) return input;
    return Math.max(val, lim);
});

// plus (math)
engine.registerFilter("plus", (input, operand) => {
    return (Number(input) || 0) + (Number(operand) || 0);
});

// money - format cents as currency for preview
engine.registerFilter("money", (input) => {
    if (input == null || input === "") return "";
    const cents = Number(input) || 0;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(cents / 100);
});

// newline_to_br - convert newlines to <br> tags
engine.registerFilter("newline_to_br", (input) => {
    if (input == null) return "";
    return String(input).replace(/\n/g, "<br>");
});

// image_tag - create img element from URL (Shopify compatibility)
engine.registerFilter("image_tag", (value, cls, loading) => {
    if (!value) return "";
    const src = typeof value === "string" ? value : (value.src || value.preview_image || "");
    if (!src) return "";
    const c = (typeof cls === "object" && cls?.class) ? cls.class : (cls || "");
    const l = (typeof cls === "object" && cls?.loading) ? cls.loading : (loading || "lazy");
    return `<img src="${src}" class="${c}" loading="${l}" alt="">`;
});

// placeholder_svg_tag - simple SVG placeholder for preview
engine.registerFilter("placeholder_svg_tag", (value, cls) => {
    const c = cls || "placeholder-svg";
    return `<svg class="${c}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525.5 525.5" width="525" height="525"><rect width="525.5" height="525.5" fill="#f0f0f0"/><path fill="#ccc" d="M262.7 161.6c-55.7 0-101 45.2-101 101s45.2 101 101 101 101-45.2 101-101-45.3-101-101-101zm0 168.3c-37.1 0-67.2-30.1-67.2-67.2s30.1-67.2 67.2-67.2 67.2 30.1 67.2 67.2-30.1 67.2-67.2 67.2z"/><path fill="#ccc" d="M415.6 214.9c-4.2-9.2-9.4-18-15.4-26.2-6.1-8.2-13.1-15.8-20.9-22.6-7.8-6.9-16.4-12.9-25.6-17.9-9.2-5-18.9-9-28.9-11.9-10-2.9-20.3-4.7-30.7-5.4-10.4-.7-20.9-.3-31.2 1.2-10.3 1.5-20.4 4.3-30 7.9-9.6 3.7-18.7 8.4-27.2 14-8.5 5.6-16.4 12.2-23.6 19.5-7.2 7.3-13.6 15.2-19.2 23.6-5.6 8.5-10.2 17.3-13.9 26.4-3.7 9.1-6.4 18.5-8.1 28-1.7 9.5-2.4 19.2-2 28.8.4 9.6 1.7 19.1 3.8 28.4 2.1 9.3 5 18.4 8.6 27.2 3.6 8.8 7.9 17.2 13 25.1 5.1 7.9 10.9 15.3 17.4 22 6.5 6.7 13.7 12.8 21.5 18.1 7.8 5.3 16.1 9.8 24.9 13.4 8.8 3.6 18 6.3 27.4 8.1 9.4 1.8 18.9 2.6 28.4 2.4 9.5-.2 19-.9 28.3-2.2 9.3-1.3 18.4-3.5 27.2-6.4 8.8-2.9 17.3-6.6 25.4-11 8.1-4.4 15.8-9.5 22.9-15.2 7.1-5.7 13.6-12.2 19.3-19.3 5.7-7.1 10.7-14.8 14.8-22.9 4.1-8.2 7.4-16.8 9.8-25.7 2.4-8.9 3.9-18 4.5-27.2.6-9.2.3-18.5-.9-27.6-1.2-9.1-3.2-18-6-26.6-2.8-8.6-6.3-16.8-10.5-24.6z"/></svg>`;
});

// strip_html - remove HTML tags
engine.registerFilter("strip_html", (input) => {
    if (input == null) return "";
    return String(input).replace(/<[^>]*>/g, "");
});

// truncatewords - limit to N words
engine.registerFilter("truncatewords", (input, count) => {
    if (input == null) return "";
    const words = String(input).trim().split(/\s+/);
    const n = Math.max(0, Number(count) || 50);
    return words.slice(0, n).join(" ") + (words.length > n ? "..." : "");
});

// handleize - Shopify-style handle (lowercase, hyphens)
engine.registerFilter("handleize", (input) => {
    if (input == null) return "";
    return String(input)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
});

// divided_by - division (for Liquid compatibility)
engine.registerFilter("divided_by", (input, divisor) => {
    const a = Number(input);
    const b = Number(divisor);
    if (Number.isNaN(a) || Number.isNaN(b) || b === 0) return 0;
    return a / b;
});

// times - multiply (Shopify)
engine.registerFilter("times", (input, operand) => {
    return (Number(input) || 0) * (Number(operand) || 0);
});

// round - round number (optional decimal places)
engine.registerFilter("round", (input, precision) => {
    const n = Number(input);
    if (Number.isNaN(n)) return 0;
    if (precision === undefined || precision === null || precision === "") {
        return Math.round(n);
    }
    const p = Number(precision);
    if (Number.isNaN(p)) return Math.round(n);
    const factor = Math.pow(10, p);
    return Math.round(n * factor) / factor;
});

// money_without_currency - cents to decimal string (no symbol)
engine.registerFilter("money_without_currency", (input) => {
    if (input == null || input === "") return "";
    const cents = Number(input) || 0;
    return (cents / 100).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
});

// limit - slice array to first N items
engine.registerFilter("limit", (arr, n) => {
    if (!Array.isArray(arr)) return [];
    const num = Math.max(0, Number(n) || 0);
    return arr.slice(0, num);
});

// first - first element of array
engine.registerFilter("first", (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[0];
});

// size - array/string length (Shopify)
engine.registerFilter("size", (input) => {
    if (input == null) return 0;
    if (Array.isArray(input)) return input.length;
    if (typeof input === "string") return input.length;
    if (typeof input === "object" && typeof input.length === "number") return input.length;
    return 0;
});

// default - fallback when blank/false
engine.registerFilter("default", (input, defaultValue) => {
    if (input == null || input === "" || input === false) return defaultValue;
    return input;
});

// default_pagination - minimal Shopify-style pagination HTML
engine.registerFilter("default_pagination", (paginate) => {
    if (!paginate || paginate.pages <= 1) return "";
    const cur = paginate.current_page || 1;
    const total = paginate.pages || 1;
    return `<nav class="pagination" aria-label="Pagination"><span>Page ${cur} of ${total}</span></nav>`;
});

// escape - HTML escape
engine.registerFilter("escape", (input) => {
    if (input == null) return "";
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
});

// url_param_escape - share / redirect URLs in sections (Shopify compatibility)
engine.registerFilter("url_param_escape", (input) => {
    if (input == null) return "";
    return encodeURIComponent(String(input));
});

// json - JSON.stringify for script attributes
engine.registerFilter("json", (input) => {
    try {
        return JSON.stringify(input);
    } catch {
        return "null";
    }
});

// t - Shopify translation key (preview: small map + empty string for | default)
engine.registerFilter("t", (key) => {
    if (key == null) return "";
    const map = {
        "templates.contact.form.post_success":
            "Thanks for contacting us! We will get back to you soon."
    };
    return map[String(key)] ?? "";
});

// default_errors - Shopify contact form errors to HTML-ish string
engine.registerFilter("default_errors", (errors) => {
    if (!errors) return "";
    if (typeof errors === "string") return errors;
    if (Array.isArray(errors)) {
        return errors
            .map((e) => (typeof e === "string" ? e : e?.message || String(e)))
            .join("<br>");
    }
    if (typeof errors === "object") {
        if (errors.message) return String(errors.message);
        if (Array.isArray(errors.messages)) return errors.messages.join("<br>");
    }
    return String(errors);
});

// color_to_rgb — Shopify-style: hex → "r, g, b" for chaining with color_modify alpha
engine.registerFilter("color_to_rgb", (input) => {
    if (input == null || input === "") return "";
    const s = String(input).trim();
    const hexMatch = s.match(/^#?([0-9a-fA-F]{6})$/);
    if (hexMatch) {
        const h = hexMatch[1];
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
    return s;
});

// metafield_tag — preview: render stored HTML or string metafield value
engine.registerFilter("metafield_tag", (input) => {
    if (input == null) return "";
    if (typeof input === "object" && input.value != null) return String(input.value);
    return String(input);
});

// color_modify - Shopify-style color modification (alpha 0-1, etc.)
engine.registerFilter("color_modify", (input, component, amount) => {
    if (input == null || typeof input !== "string") return input || "";
    const raw = String(input).trim();
    const comp = String(component || "").toLowerCase();
    const amt = Number(amount);
    const rgbComma = raw.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
    if (rgbComma && comp === "alpha" && !Number.isNaN(amt)) {
        const r = parseInt(rgbComma[1], 10);
        const g = parseInt(rgbComma[2], 10);
        const b = parseInt(rgbComma[3], 10);
        const a = Math.min(1, Math.max(0, amt));
        return `rgba(${r},${g},${b},${a})`;
    }
    const hex = raw.replace(/^#/, "");
    if (hex.length !== 6 && hex.length !== 8) return input;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (comp === "alpha") {
        const a = Math.min(1, Math.max(0, amt));
        return `rgba(${r},${g},${b},${a})`;
    }
    if (comp === "red") return `#${Math.min(255, Math.max(0, r + amt)).toString(16).padStart(2, "0")}${hex.slice(2, 4)}${hex.slice(4, 6)}`;
    if (comp === "green") return `#${hex.slice(0, 2)}${Math.min(255, Math.max(0, g + amt)).toString(16).padStart(2, "0")}${hex.slice(4, 6)}`;
    if (comp === "blue") return `#${hex.slice(0, 2)}${hex.slice(2, 4)}${Math.min(255, Math.max(0, b + amt)).toString(16).padStart(2, "0")}`;
    return input;
});

/* -------------------------
   Generic Template Rendering
--------------------------*/

/** Inlined into preview HTML: block link navigation and form posts (srcDoc iframe would otherwise hit app host → 404). */
const PREVIEW_NAVIGATION_LOCK_SCRIPT = `<script>
(function() {
    function shouldBlockHref(href) {
        if (href == null) return false;
        var t = String(href).trim();
        if (t === "") return false;
        var low = t.toLowerCase();
        if (low.indexOf("javascript:") === 0) return false;
        return true;
    }
    document.addEventListener("click", function(event) {
        var a = event.target && event.target.closest && event.target.closest("a[href]");
        if (!a) return;
        if (!shouldBlockHref(a.getAttribute("href"))) return;
        event.preventDefault();
    }, true);
    document.addEventListener("submit", function(event) {
        event.preventDefault();
    }, true);
})();
</script>`;

/** Preview iframe owns its own vertical scroll so wheel/trackpad over the preview always scrolls the rendered document (no clipped sections, no host/iframe scroll fight).
 * Use overflow-x: clip (not hidden) and keep body out of a flex formatting context so `position: sticky`
 * gallery columns work the same as on the published storefront. */
const PREVIEW_DOCUMENT_BASE_STYLE = `<style>html{box-sizing:border-box;height:100%;width:100%;overflow-y:auto;overflow-x:clip;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}body{box-sizing:border-box;display:block!important;margin:0;padding:0;min-height:100%;width:100%;max-width:100%;overflow:visible}*,*::before,*::after{box-sizing:inherit}</style>`;

/**
 * Renders a Liquid template with the given context.
 * @param {string} templateName - Template file name without extension (e.g. "before-after")
 * @param {object} context - Context object (product, block, shop, etc.)
 * @param {object} [options] - Options
 * @param {boolean} [options.stripAssetTags=true] - Strip <link> and <script> tags referencing /assets/
 * @param {string} [options.cssContent] - CSS content to inline in the HTML
 * @param {string} [options.jsContent] - JS content to inline in the HTML
 * @param {string[]} [options.reinitHooks] - Reinit hooks to call when preview HTML updates
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderTemplate(templateName, context, options = {}) {
    const { stripAssetTags = true, cssContent, jsContent, reinitHooks = [] } = options;

    let html = await engine.renderFile(templateName, context);

    if (stripAssetTags) {
        html = html.replace(
            /<link[^>]+href="[^"]*\/assets\/[^"]*"[^>]*>\s*/gi,
            ""
        );
        html = html.replace(
            /<script[^>]+src="[^"]*\/assets\/[^"]*"[^>]*><\/script>\s*/gi,
            ""
        );
    }

    // If CSS/JS content is provided, wrap in a complete HTML document
    if (cssContent || jsContent) {
        const hooks = Array.isArray(reinitHooks) ? reinitHooks : [];
        const reinitScript = hooks.length
            ? `<script>
function showAppBlocks(){var el=document.querySelectorAll(".app_blocks_class");el.forEach(function(e){e.style.display="";});}
function runReinit(){showAppBlocks();${hooks.map((n) => `if(typeof window["${n}"]==="function")window["${n}"]();`).join("")}}
if(document.readyState==="complete")runReinit();else window.addEventListener("load",runReinit);
</script>`
            : "";

        const cssBlock = cssContent ? `<style>${cssContent}</style>` : "";
        const jsBlock = jsContent ? `<script>${jsContent}</script>` : "";

        return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${PREVIEW_DOCUMENT_BASE_STYLE}
  ${cssBlock}
</head><body>
  ${html}${jsBlock}${reinitScript}${PREVIEW_NAVIGATION_LOCK_SCRIPT}
</body></html>`;
    }

    return html;
}

/**
 * Renders multiple Liquid templates and concatenates the HTML.
 * Each template is wrapped in a div with data-liquid-section for scroll-to-section support.
 * @param {Array<{ template: string, context: object, displayName?: string }>} items
 * @param {object} [options]
 * @param {string} [options.cssContent] - CSS content to inline in the HTML
 * @param {string} [options.jsContent] - JS content to inline in the HTML
 * @param {string[]} [options.reinitHooks] - Reinit hooks to call when preview HTML updates
 * @returns {Promise<string>}
 */
export async function renderTemplates(items, options = {}) {
    const { cssContent, jsContent, reinitHooks } = options;
    // Only wrap in HTML document if CSS/JS content is provided
    const shouldWrap = !!(cssContent || jsContent);
    
    const results = await Promise.all(
        items.map(({ template, context }) =>
            renderTemplate(template, context, shouldWrap ? {} : options)
        )
    );

    let html = results
        .map(
            (html, i) => {
                // Use block.id if available for unique IDs, otherwise fall back to template name
                const blockId = items[i].context?.block?.id;
                const sectionId = blockId ? `section-${blockId}` : `section-${items[i].template}`;
                const dnAttr = dataLiquidSectionDisplayNameAttr(items[i].displayName);
                return `<div data-liquid-section="${items[i].template}"${dnAttr} data-block-id="${blockId || ''}" id="${sectionId}">${html}</div>`;
            }
        )
        .join("");

    // Wrap in complete HTML document if CSS/JS content is provided
    if (shouldWrap) {
        const hooks = Array.isArray(reinitHooks) ? reinitHooks : [];
        const reinitScript = hooks.length
            ? `<script>
function showAppBlocks(){var el=document.querySelectorAll(".app_blocks_class");el.forEach(function(e){e.style.display="";});}
function runReinit(){showAppBlocks();${hooks.map((n) => `if(typeof window["${n}"]==="function")window["${n}"]();`).join("")}}
if(document.readyState==="complete")runReinit();else window.addEventListener("load",runReinit);
</script>`
            : "";

        const cssBlock = cssContent ? `<style>${cssContent}</style>` : "";
        const jsBlock = jsContent ? `<script>${jsContent}</script>` : "";

        return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${PREVIEW_DOCUMENT_BASE_STYLE}
  ${cssBlock}
</head><body>
  ${html}${jsBlock}${reinitScript}${PREVIEW_NAVIGATION_LOCK_SCRIPT}
</body></html>`;
    }

    return html;
}

/**
 * Renders a single row item (template or column of templates).
 * @param {object|object[]} item - { template, context } or array of same
 * @param {object} options
 * @returns {Promise<string>}
 */
async function renderRowItem(item, options) {
    if (Array.isArray(item)) {
        const htmls = await Promise.all(
            item.map(({ template, context }) => renderTemplate(template, context, options))
        );
        return item
            .map(
                (t, i) => {
                    // Use block.id if available for unique IDs, otherwise fall back to template name
                    const blockId = t.context?.block?.id;
                    const sectionId = blockId ? `section-${blockId}` : `section-${t.template}`;
                    const dnAttr = dataLiquidSectionDisplayNameAttr(t.displayName);
                    return `<div data-liquid-section="${t.template}"${dnAttr} data-block-id="${blockId || ''}" id="${sectionId}">${htmls[i]}</div>`;
                }
            )
            .join("");
    }
    const { template, context, displayName } = item;
    const html = await renderTemplate(template, context, options);
    // Use block.id if available for unique IDs, otherwise fall back to template name
    const blockId = context?.block?.id;
    const sectionId = blockId ? `section-${blockId}` : `section-${template}`;
    const dnAttr = dataLiquidSectionDisplayNameAttr(displayName);
    return `<div data-liquid-section="${template}"${dnAttr} data-block-id="${blockId || ''}" id="${sectionId}">${html}</div>`;
}

/**
 * Renders rows of Liquid templates with layout support.
 * - Row with 2+ elements → horizontal flex row (each element can be single template or array for column)
 * - Row with 1 element → column (full width, stacked)
 * - Item can be { template, context } or [{ template, context }, ...] for vertical stack
 * @param {Array<Array<{ template: string, context: object, displayName?: string }|Array<{ template: string, context: object, displayName?: string }>>>} rows
 * @param {object} [options]
 * @param {string} [options.cssContent] - CSS content to inline in the HTML
 * @param {string} [options.jsContent] - JS content to inline in the HTML
 * @param {string[]} [options.reinitHooks] - Reinit hooks to call when preview HTML updates
 * @returns {Promise<string>}
 */
export async function renderTemplateRows(rows, options = {}) {
    const { cssContent, jsContent, reinitHooks } = options;
    const shouldWrap = !!(cssContent || jsContent);
    const rowHtmls = await Promise.all(
        rows.map(async (items) => {
            const sectionHtmls = await Promise.all(
                items.map((item) => renderRowItem(item, shouldWrap ? {} : options))
            );
            const sections = sectionHtmls
                .map(
                    (html, i) => {
                        const item = items[i];
                        const flexStyle = items.length >= 2 ? "flex:1;min-width:0;display:flex;flex-direction:column;gap:0.5rem" : "";
                        return `<div ${flexStyle ? `style="${flexStyle}"` : ""}>${html}</div>`;
                    }
                )
                .join("");
            const isHorizontal = items.length >= 2;
            const rowStyle = isHorizontal
                ? "display:flex;flex-direction:row;gap:1rem;width:100%;align-items:flex-start"
                : "display:block;width:100%";
            return `<div class="liquid-row" style="${rowStyle}">${sections}</div>`;
        })
    );
    
    let html = rowHtmls.join("");

    // Wrap in complete HTML document if CSS/JS content is provided
    if (shouldWrap) {
        const hooks = Array.isArray(reinitHooks) ? reinitHooks : [];
        const reinitScript = hooks.length
            ? `<script>
function showAppBlocks(){var el=document.querySelectorAll(".app_blocks_class");el.forEach(function(e){e.style.display="";});}
function runReinit(){showAppBlocks();${hooks.map((n) => `if(typeof window["${n}"]==="function")window["${n}"]();`).join("")}}
if(document.readyState==="complete")runReinit();else window.addEventListener("load",runReinit);
</script>`
            : "";
        
        // Scroll handler script - listens for postMessage to scroll to sections
        const scrollHandlerScript = `<script>
(function() {
    function scrollToSection(sectionId) {
        if (!sectionId) return;
        
        const sectionIdWithPrefix = sectionId.startsWith('section-') ? sectionId : 'section-' + sectionId;
        let element = document.getElementById(sectionIdWithPrefix);
        
        // Fallback: try finding by data-block-id attribute
        if (!element) {
            element = document.querySelector('[data-block-id="' + sectionId + '"]');
        }
        
        // Another fallback: try finding by data-liquid-section attribute
        if (!element) {
            element = document.querySelector('[data-liquid-section="' + sectionId + '"]');
        }
        
        if (element) {
            // Scroll element into view within iframe
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Calculate position and notify parent to scroll
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const elementTop = rect.top + scrollTop;
            
            // Send message to parent with element position
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'SCROLL_TO_SECTION',
                    sectionId: sectionId,
                    elementTop: elementTop,
                    elementHeight: rect.height
                }, '*');
            }
            
            return true;
        }
        return false;
    }
    
    // Listen for postMessage from parent
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SCROLL_TO_SECTION') {
            scrollToSection(event.data.sectionId);
        }
        if (event.data && event.data.type === 'SCROLL' && event.data.deltaY != null) {
            var el = document.documentElement || document.body;
            if (el) el.scrollTop += event.data.deltaY;
        }
    });
    
    // Expose function globally for direct calls
    window.scrollToSection = scrollToSection;
})();
</script>`;

        // Click handler script - listens for clicks on sections and notifies parent
        // Also adds hover highlighting and section name display. Only active when selector mode is enabled.
        const clickHandlerScript = `<script>
(function() {
    var selectorModeEnabled = false;
    var selectedSectionId = null;
    var currentSelectedSectionElement = null;
    
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SET_SELECTOR_MODE') {
            selectorModeEnabled = event.data.enabled;
            selectedSectionId = event.data.selectedSectionId || null;
            if (!selectorModeEnabled) {
                removeHoverLabel();
                highlightSelectedSection(null);
            } else {
                highlightSelectedSection(selectedSectionId);
            }
        }
    });
    
    function getSectionElement(element) {
        // Walk up the DOM tree to find the section wrapper
        let current = element;
        while (current && current !== document.body) {
            // Check if this element has section attributes
            if (current.hasAttribute && current.hasAttribute('data-liquid-section')) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }
    
    function getSectionId(sectionElement) {
        if (!sectionElement) return null;
        const blockId = sectionElement.getAttribute('data-block-id');
        const template = sectionElement.getAttribute('data-liquid-section');
        // Return blockId if available, otherwise template name (matching LiquidPreviewSettingsPanel logic)
        return blockId || template;
    }
    
    function formatSectionName(template) {
        const specialCases = {
            'before-after': 'Before & After',
            'product-section': 'Kluck AI Hero Section',
            'hero-section': 'Kluck AI Hero Section'
        };
        if (specialCases[template]) return specialCases[template];
        return template
            .split('-')
            .map(function(word) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }
    
    let hoverLabel = null;
    let currentHoveredSection = null;
    
    function createHoverLabel(sectionElement) {
        if (hoverLabel) {
            document.body.removeChild(hoverLabel);
        }
        
        const template = sectionElement.getAttribute('data-liquid-section');
        const displayNameAttr = sectionElement.getAttribute('data-liquid-section-display-name');
        const sectionName = displayNameAttr || formatSectionName(template);

        hoverLabel = document.createElement('div');
        hoverLabel.style.cssText = 'position: absolute; top: 8px; left: 8px; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; z-index: 10000; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
        hoverLabel.textContent = sectionName;
        
        document.body.appendChild(hoverLabel);
    }
    
    function updateHoverLabelPosition(sectionElement) {
        if (!hoverLabel || !sectionElement) return;
        
        const rect = sectionElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        hoverLabel.style.top = (rect.top + scrollTop + 8) + 'px';
        hoverLabel.style.left = (rect.left + scrollLeft + 8) + 'px';
    }
    
    function removeHoverLabel() {
        if (hoverLabel) {
            document.body.removeChild(hoverLabel);
            hoverLabel = null;
        }
        if (currentHoveredSection) {
            // Remove inner border pseudo-element
            const pseudoElement = currentHoveredSection.querySelector('.section-hover-border');
            if (pseudoElement) {
                pseudoElement.remove();
            }
            currentHoveredSection.style.cursor = '';
            currentHoveredSection = null;
        }
    }
    
    function addInnerBorder(sectionElement) {
        // Remove any existing border element
        const existing = sectionElement.querySelector('.section-hover-border');
        if (existing) {
            existing.remove();
        }
        
        // Create inner border element
        const borderElement = document.createElement('div');
        borderElement.className = 'section-hover-border';
        borderElement.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 2px dashed #3b82f6; border-radius: 8px; pointer-events: none; z-index: 9999;';
        
        // Ensure parent has relative positioning
        const originalPosition = sectionElement.style.position;
        if (!originalPosition || originalPosition === 'static') {
            sectionElement.style.position = 'relative';
        }
        
        sectionElement.appendChild(borderElement);
    }
    
    function addSelectedBorder(sectionElement) {
        var existing = sectionElement.querySelector('.section-selected-border');
        if (existing) existing.remove();
        var borderEl = document.createElement('div');
        borderEl.className = 'section-selected-border';
        borderEl.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 2px dashed #3b82f6; border-radius: 8px; pointer-events: none; z-index: 9998;';
        var pos = sectionElement.style.position;
        if (!pos || pos === 'static') sectionElement.style.position = 'relative';
        sectionElement.appendChild(borderEl);
    }
    
    function highlightSelectedSection(id) {
        if (currentSelectedSectionElement) {
            var old = currentSelectedSectionElement.querySelector('.section-selected-border');
            if (old) old.remove();
            currentSelectedSectionElement = null;
        }
        if (!id || !selectorModeEnabled) return;
        var all = document.querySelectorAll('[data-liquid-section]');
        for (var i = 0; i < all.length; i++) {
            if (getSectionId(all[i]) === id) {
                currentSelectedSectionElement = all[i];
                addSelectedBorder(currentSelectedSectionElement);
                break;
            }
        }
    }
    
    // Add hover and click handlers (only when selector mode is on)
    document.addEventListener('mouseover', function(event) {
        if (!selectorModeEnabled) return;
        const sectionElement = getSectionElement(event.target);
        if (sectionElement && sectionElement !== currentHoveredSection) {
            // Remove previous hover
            removeHoverLabel();
            
            // Add hover to new section
            currentHoveredSection = sectionElement;
            sectionElement.style.cursor = 'pointer';
            addInnerBorder(sectionElement);
            
            createHoverLabel(sectionElement);
            updateHoverLabelPosition(sectionElement);
        } else if (sectionElement === currentHoveredSection) {
            // Update position if scrolling
            updateHoverLabelPosition(sectionElement);
        }
    }, true);
    
    document.addEventListener('mouseout', function(event) {
        if (!selectorModeEnabled) return;
        const sectionElement = getSectionElement(event.target);
        if (sectionElement === currentHoveredSection) {
            // Check if we're moving to a child element
            const relatedTarget = event.relatedTarget;
            if (!relatedTarget || !sectionElement?.contains(relatedTarget)) {
                removeHoverLabel();
            }
        }
    }, true);
    
    // Update label position on scroll
    window.addEventListener('scroll', function() {
        if (currentHoveredSection && hoverLabel) {
            updateHoverLabelPosition(currentHoveredSection);
        }
    }, true);
    
    // Add click handler to document (only when selector mode is on)
    document.addEventListener('click', function(event) {
        if (!selectorModeEnabled) return;
        const sectionElement = getSectionElement(event.target);
        if (sectionElement) {
            const sectionId = getSectionId(sectionElement);
            if (sectionId && window.parent && window.parent !== window) {
                // Send message to parent to select this section
                window.parent.postMessage({
                    type: 'SELECT_SECTION',
                    sectionId: sectionId
                }, '*');
            }
        }
    }, true); // Use capture phase to catch clicks early
})();
</script>`;

        const cssBlock = cssContent ? `<style>${cssContent}</style>` : "";
        const jsBlock = jsContent ? `<script>${jsContent}</script>` : "";

        return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${PREVIEW_DOCUMENT_BASE_STYLE}
  ${cssBlock}
</head><body>
  ${html}${jsBlock}${reinitScript}${scrollHandlerScript}${PREVIEW_NAVIGATION_LOCK_SCRIPT}${clickHandlerScript}
</body></html>`;
    }

    return html;
}

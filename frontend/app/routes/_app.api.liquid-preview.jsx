import { renderTemplate, renderTemplates, renderTemplateRows } from "../utils/liquid.server";
import {
    getCssContentForPreviewType,
    getJsContentForPreviewType,
    getReinitHooksForPreviewType,
} from "../utils/theme-content";
import { buildDynamicCss } from "../utils/stylePreferences";

/**
 * POST /app/api/liquid-preview
 * Renders Liquid template(s) with provided context.
 * Body: { template, context } or { templates: [...] } or { templateRows: [[...], [...]] }
 * Optional: { stylePreferences: { colorSchemeId, headingFont, bodyFont } } for dynamic colors/fonts
 * Optional: { type: "entire-store" | "cinematic-home" | "landing-page" }
 * CSS/JS content is automatically inlined to improve LCP.
 */
export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { templates, templateRows, stylePreferences, type = 'landing-page' } = body;

        const cssContent = buildDynamicCss(
            stylePreferences,
            getCssContentForPreviewType(type)
        );
        // Options with inlined CSS/JS content for better LCP
        const renderOptions = {
            cssContent,
            jsContent: getJsContentForPreviewType(type),
            reinitHooks: getReinitHooksForPreviewType(type),
        };

        if (templateRows && Array.isArray(templateRows)) {
            const isValidItem = (item) => {
                if (Array.isArray(item)) {
                    return item.every((t) => t?.template && t?.context && typeof t.context === "object");
                }
                return item?.template && item?.context && typeof item.context === "object";
            };
            const valid = templateRows.every(
                (row) => Array.isArray(row) && row.every(isValidItem)
            );
            if (!valid) {
                return Response.json(
                    { error: "templateRows: each row item must be { template, context } or array of same" },
                    { status: 400 }
                );
            }
            const html = await renderTemplateRows(templateRows, renderOptions);
            return Response.json({ html });
        }

        if (templates && Array.isArray(templates)) {
            const valid = templates.every(
                (t) => t?.template && t?.context && typeof t.context === "object"
            );
            if (!valid) {
                return Response.json(
                    { error: "templates must be [{ template, context }, ...]" },
                    { status: 400 }
                );
            }
            const html = await renderTemplates(templates, renderOptions);
            return Response.json({ html });
        }

        const { template, context, product, block, shop } = body;

        const templateName = template || body.template;
        const ctx =
            context ??
            (product != null && block != null && shop != null
                ? { product, block, shop }
                : null);

        if (!templateName) {
            return Response.json(
                { error: "template is required" },
                { status: 400 }
            );
        }
        if (!ctx || typeof ctx !== "object") {
            return Response.json(
                { error: "context (or product, block, shop) is required" },
                { status: 400 }
            );
        }

        const html = await renderTemplate(templateName, ctx, renderOptions);
        return Response.json({ html });
    } catch (error) {
        console.error("[liquid-preview] Render error:", error);
        return Response.json(
            { error: error?.message || "Failed to render Liquid" },
            { status: 500 }
        );
    }
}

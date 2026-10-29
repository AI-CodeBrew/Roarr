#!/usr/bin/env node
/**
 * Card screenshots for the Aura, Noir and Frost product page templates (same idea as
 * build-lumenook-previews.mjs; neither has a prebuilt CDN demo).
 *
 * Usage (from frontend/), after `node scripts/build-demo-art.mjs`:
 *   npx vite-node scripts/build-product-previews.mjs          (all)
 *   npx vite-node scripts/build-product-previews.mjs frost    (one: aura, noir or frost)
 *
 * Renders each product page with the in-app preview CSS/JS and its demo copy + photos, then writes
 * public/demo-previews/<name>/product.jpg (card, top 1280×720) and product.eye.jpg (full page,
 * scrolled on card hover).
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { renderTemplateRows } from "../app/utils/liquid.server.js";
import {
  getCssContentForPreviewType,
  getJsContentForPreviewType,
  getReinitHooksForPreviewType,
} from "../app/utils/theme-content.js";
import { buildDynamicCss } from "../app/utils/stylePreferences.js";
import { getCategoryTemplate1Defaults } from "../app/lib/categoryHomeDefaults.js";
import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "../app/routes/_app.generate_pdp/product-page/utils/productAiResponeMapping.js";
import { generateTemplateConfig } from "../app/routes/_app.generate_pdp/product-page/utils/productTemplatesConfig.js";
import { getDefaultColor, getDefaultMagicResponses } from "../app/routes/_app.generate_pdp/product-page/utils/default-magic-responses/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const JOBS = [
  { name: "aura", category: "health_beauty", template: 3, assets: "aura-assets" },
  { name: "noir", category: "general", template: 5, assets: "noir-assets" },
  { name: "frost", category: "general", template: 6, assets: "frost-assets" },
];

/** The rendered HTML references "/<assets>/..." (same-origin in the app); point it at the files on disk. */
function withLocalAssetPaths(html, assets) {
  return html.replaceAll(`"/${assets}/`, `"${pathToFileURL(path.join(PUBLIC, assets)).href}/`);
}

/** Reject if `promise` doesn't settle within `ms`. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)),
  ]);
}

function buildRows({ category, template }) {
  const defaults = getDefaultMagicResponses(category, { template });
  const color = getDefaultColor(category, { template }) || defaults.color;
  const magic = {
    ...DEFAULT_MAGIC_RESPONSE,
    images: defaults.images,
    text: defaults.text,
    selected_color: color,
    color_schemes: color ? [color] : [],
  };
  return { color, rows: generateTemplateConfig(category, aiResponseMapping(magic), template, magic) };
}

async function capture(browser, job, tmpDir) {
  const { color, rows } = buildRows(job);
  const fonts = getCategoryTemplate1Defaults(job.category) || {};
  const html = await renderTemplateRows(rows, {
    cssContent: buildDynamicCss(
      { dynamicColor: color || "#2563EB", headingFont: fonts.headingFont || "Montserrat", bodyFont: fonts.bodyFont || "Inter" },
      getCssContentForPreviewType("landing-page"),
    ),
    jsContent: getJsContentForPreviewType("landing-page"),
    reinitHooks: getReinitHooksForPreviewType("landing-page"),
  });
  const htmlPath = path.join(tmpDir, `${job.name}.html`);
  fs.writeFileSync(htmlPath, withLocalAssetPaths(html, job.assets), "utf8");

  const outDir = path.join(PUBLIC, "demo-previews", job.name);
  fs.mkdirSync(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30000);
  try {
    await withTimeout(page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load", timeout: 20000 }), 25000, "goto").catch(() => {});
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" }).catch(() => {});
    // Best-effort: let fonts/images settle, but a stuck font request must not hang the run.
    await withTimeout(
      page.evaluate(async () => {
        // Lazy images far below the fold would otherwise be blank in the full-page shot.
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; });
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all([...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
        window.scrollTo(0, 0);
      }),
      8000,
      "fonts-images",
    ).catch(() => {});
    await page.waitForTimeout(400);
    const broken = await page.evaluate(() => [...document.images].filter((img) => !img.naturalWidth).map((img) => img.src));
    if (broken.length) console.warn(`${job.name}: ${broken.length} image(s) did not load`, broken.slice(0, 3));
    // Fixed bars (Frost's add-to-cart dock) sit off-screen until scroll, but a full-page shot would show them mid-page.
    await page.addStyleTag({ content: "[data-fr-sticky]{display:none!important}" }).catch(() => {});
    const card = path.join(outDir, "product.jpg");
    const eye = path.join(outDir, "product.eye.jpg");
    await page.screenshot({ path: card, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    await page.screenshot({ path: eye, type: "jpeg", quality: 74, fullPage: true });
    const kb = (p) => `${Math.round(fs.statSync(p).size / 1024)} KB`;
    console.log(`${job.name}: card ${kb(card)}, eye ${kb(eye)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const { chromium } = await import("playwright");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "product-previews-"));
  const browser = await chromium.launch({ headless: true });
  try {
    const only = process.argv[2];
    for (const job of JOBS.filter((j) => !only || j.name === only)) {
      try {
        await capture(browser, job, tmpDir);
      } catch (err) {
        console.error(`${job.name}: FAILED — ${err?.message || err}`);
      }
    }
  } finally {
    await browser.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

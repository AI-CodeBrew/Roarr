#!/usr/bin/env node
/**
 * Card screenshots for the Lumenook templates (no prebuilt S3 demos exist for them yet).
 *
 * Usage (from frontend/):
 *   npx vite-node scripts/build-lumenook-previews.mjs
 *
 * Renders the Lumenook product page and the Lumenook store homepage with the same CSS/JS as the
 * in-app preview, then writes to public/demo-previews/lumenook/:
 *   <name>.jpg      — card thumb (1280×720, top of the page)
 *   <name>.eye.jpg  — full page, scrolled through on card hover
 * The app serves these at /demo-previews/lumenook/<name>.jpg.
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
import { buildLiquidPageTemplatesConfig } from "../app/routes/_app.generate_store/store/utils/storeTemplatesConfiq.js";
import { buildLumenookHomeData, buildLumenookDemoGridProducts } from "../app/routes/_app.generate_store/store/utils/buildLumenookDemo.js";
import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "../app/routes/_app.generate_pdp/product-page/utils/productAiResponeMapping.js";
import { generateTemplateConfig } from "../app/routes/_app.generate_pdp/product-page/utils/productTemplatesConfig.js";
import { getDefaultColor, getDefaultMagicResponses } from "../app/routes/_app.generate_pdp/product-page/utils/default-magic-responses/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "demo-previews", "lumenook");
/** The rendered HTML references "/lumenook-assets/..." (same-origin on the real app); for this
 * local file:// screenshot pass, rewrite those to the actual public folder on disk. */
const ASSETS_DIR = pathToFileURL(path.join(ROOT, "public", "lumenook-assets")).href;

function withLocalAssetPaths(html) {
  return html.replaceAll('"/lumenook-assets/', `"${ASSETS_DIR}/`);
}

function defaultStyle(category) {
  const defaults = getCategoryTemplate1Defaults(category) || {};
  return {
    dynamicColor: getDefaultColor(category) || "#2563EB",
    headingFont: defaults.headingFont || "Montserrat",
    bodyFont: defaults.bodyFont || "Inter",
  };
}

function productJob() {
  const defaults = getDefaultMagicResponses("general", { template: 4 });
  const magic = {
    ...DEFAULT_MAGIC_RESPONSE,
    images: defaults.images,
    text: defaults.text,
    selected_color: defaults.color,
    color_schemes: [defaults.color],
  };
  return {
    name: "product",
    type: "landing-page",
    stylePreferences: defaultStyle("general"),
    templateRows: generateTemplateConfig("general", aiResponseMapping(magic), 4, magic),
  };
}

function storeJob() {
  const stylePreferences = defaultStyle("general");
  return {
    name: "store",
    type: "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType: "multi-product",
      pageType: "home-page",
      productData: null,
      detectedCategory: "general",
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults: getCategoryTemplate1Defaults("general"),
      homeData: buildLumenookHomeData(),
      marketType: "prepaid",
      storeTemplatePack: "lumenook",
      collectionProducts: buildLumenookDemoGridProducts(),
    }),
  };
}

/** Reject if `promise` doesn't settle within `ms` — a stuck font/network call must not hang the batch. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)),
  ]);
}

async function captureJob(browser, job, tmpDir) {
  const html = await renderTemplateRows(job.templateRows, {
    cssContent: buildDynamicCss(job.stylePreferences, getCssContentForPreviewType(job.type)),
    jsContent: getJsContentForPreviewType(job.type),
    reinitHooks: getReinitHooksForPreviewType(job.type),
  });
  const htmlPath = path.join(tmpDir, `${job.name}.html`);
  fs.writeFileSync(htmlPath, withLocalAssetPaths(html), "utf8");

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  try {
    await withTimeout(
      page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load", timeout: 15000 }),
      20000,
      "goto",
    );
    await withTimeout(
      page.evaluate(() => {
        const style = document.createElement("style");
        style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
        document.head.appendChild(style);
        window.scrollTo(0, 0);
      }),
      5000,
      "freeze-motion",
    ).catch(() => {});
    // Best-effort: let fonts/images settle, but never block the shot on it.
    await withTimeout(
      page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all(
          [...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : null)),
        );
      }),
      6000,
      "fonts-images",
    ).catch(() => {});
    await page.waitForTimeout(300);

    const card = path.join(OUT_DIR, `${job.name}.jpg`);
    const eye = path.join(OUT_DIR, `${job.name}.eye.jpg`);
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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumenook-previews-"));
  const jobs = [productJob(), storeJob()];
  const browser = await chromium.launch({ headless: true });
  try {
    for (const job of jobs) {
      try {
        await captureJob(browser, job, tmpDir);
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

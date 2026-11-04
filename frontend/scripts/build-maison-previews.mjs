#!/usr/bin/env node
/**
 * Card screenshots for the Maison store template (no prebuilt S3 demos exist for it).
 *
 * Usage (from frontend/):
 *   npx vite-node scripts/build-maison-previews.mjs                 card + eye shots
 *   npx vite-node scripts/build-maison-previews.mjs --mobile <dir>  also a 390px full-page shot in <dir>
 *
 * Renders the Maison store homepage with the same CSS/JS as the in-app preview, then writes to
 * public/demo-previews/maison/:
 *   store.jpg         — card thumb (1280×720, top of the page)
 *   store.eye.jpg     — full page, scrolled through on card hover
 *   store.eye-sm.jpg  — the full page at 720px wide for the small dashboard cards
 * The app serves these at /demo-previews/maison/<name>.jpg.
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
import { buildMaisonHomeData } from "../app/routes/_app.generate_store/store/utils/buildMaisonDemo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "demo-previews", "maison");
/** The rendered HTML references "/maison-assets/..." (same-origin on the real app); for this
 * local file:// screenshot pass, rewrite those to the actual public folder on disk. */
const ASSETS_DIR = pathToFileURL(path.join(ROOT, "public", "maison-assets")).href;

const withLocalAssetPaths = (html) => html.replaceAll('"/maison-assets/', `"${ASSETS_DIR}/`);

function storeJob() {
  const defaults = getCategoryTemplate1Defaults("general") || {};
  const stylePreferences = {
    dynamicColor: "#B08D57",
    headingFont: defaults.headingFont || "Montserrat",
    bodyFont: defaults.bodyFont || "Inter",
  };
  return {
    name: "store",
    type: "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType: "single-product",
      pageType: "home-page",
      productData: null,
      detectedCategory: "general",
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults: getCategoryTemplate1Defaults("general"),
      homeData: buildMaisonHomeData(),
      marketType: "prepaid",
      storeTemplatePack: "maison",
      omitCheckoutBlocks: true,
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

async function openSettled(browser, htmlPath, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  await withTimeout(page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load", timeout: 15000 }), 20000, "goto");
  await page
    .evaluate(() => {
      const style = document.createElement("style");
      style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
      document.head.appendChild(style);
      window.scrollTo(0, 0);
    })
    .catch(() => {});
  // Load every image now (lazy ones far below the fold would otherwise be missing from the
  // full-page shot), then scroll through once for anything that still waits on visibility.
  await page
    .evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = "eager";
      });
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    })
    .catch(() => {});
  // Best-effort: let fonts/images settle, but never block the shot on it.
  await withTimeout(
    page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all([...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
    }),
    8000,
    "fonts-images",
  ).catch(() => {});
  await page.waitForTimeout(300);
  return page;
}

async function main() {
  const { chromium } = await import("playwright");
  const mobileFlag = process.argv.indexOf("--mobile");
  const mobileDir = mobileFlag > -1 ? process.argv[mobileFlag + 1] : null;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "maison-previews-"));
  const job = storeJob();
  const html = await renderTemplateRows(job.templateRows, {
    cssContent: buildDynamicCss(job.stylePreferences, getCssContentForPreviewType(job.type)),
    jsContent: getJsContentForPreviewType(job.type),
    reinitHooks: getReinitHooksForPreviewType(job.type),
  });
  const htmlPath = path.join(tmpDir, `${job.name}.html`);
  fs.writeFileSync(htmlPath, withLocalAssetPaths(html), "utf8");

  const browser = await chromium.launch({ headless: true });
  const kb = (p) => `${Math.round(fs.statSync(p).size / 1024)} KB`;
  try {
    const page = await openSettled(browser, htmlPath, 1280);
    const card = path.join(OUT_DIR, `${job.name}.jpg`);
    const eye = path.join(OUT_DIR, `${job.name}.eye.jpg`);
    await page.screenshot({ path: card, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    await page.screenshot({ path: eye, type: "jpeg", quality: 74, fullPage: true });
    await page.close();

    // Small card version: let the browser resample the full-page shot to 720px wide.
    const small = path.join(OUT_DIR, `${job.name}.eye-sm.jpg`);
    const shrink = await browser.newPage({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 1 });
    // A file:// page (not about:blank) so the browser is allowed to load the local screenshot.
    const shrinkHtml = path.join(tmpDir, "shrink.html");
    fs.writeFileSync(
      shrinkHtml,
      `<!doctype html><body style="margin:0"><img src="${pathToFileURL(eye).href}" style="display:block;width:720px;height:auto"></body>`,
    );
    await shrink.goto(pathToFileURL(shrinkHtml).href, { waitUntil: "load" });
    await shrink.screenshot({ path: small, type: "jpeg", quality: 86, fullPage: true });
    await shrink.close();
    console.log(`${job.name}: card ${kb(card)}, eye ${kb(eye)}, eye-sm ${kb(small)}`);

    if (mobileDir) {
      fs.mkdirSync(mobileDir, { recursive: true });
      const mobile = await openSettled(browser, htmlPath, 390);
      const shot = path.join(mobileDir, `${job.name}.mobile.jpg`);
      await mobile.screenshot({ path: shot, type: "jpeg", quality: 74, fullPage: true });
      const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await mobile.close();
      console.log(`${job.name}: mobile ${kb(shot)} (horizontal overflow: ${overflow}px)`);
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

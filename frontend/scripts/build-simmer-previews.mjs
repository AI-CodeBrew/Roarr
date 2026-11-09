#!/usr/bin/env node
/**
 * Card screenshots for the Simmer store template, using the same CSS/JS as the in-app preview.
 *
 * Usage (from frontend/):
 *   npx vite-node scripts/build-simmer-previews.mjs                 card + eye shots
 *   npx vite-node scripts/build-simmer-previews.mjs --check <dir>   also full-page shots of the home,
 *                                                                   collection, collection list and
 *                                                                   product pages at 1440px and 390px in <dir>
 *
 * Writes public/demo-previews/simmer/: store.jpg (card), store.eye.jpg (full page), store.eye-sm.jpg.
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
import {
  buildSimmerHomeData,
  buildSimmerDemoGridProducts,
  buildSimmerDemoProduct,
} from "../app/routes/_app.generate_store/store/utils/buildSimmerDemo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "demo-previews", "simmer");
const ASSETS_DIR = pathToFileURL(path.join(ROOT, "public", "simmer-assets")).href;

const withLocalAssetPaths = (html) => html.replaceAll('"/simmer-assets/', `"${ASSETS_DIR}/`).replaceAll('\\"/simmer-assets/', `\\"${ASSETS_DIR}/`);

async function renderPage(pageType, tmpDir) {
  const stylePreferences = { dynamicColor: "#df9a7c", headingFont: "Jost", bodyFont: "Jost" };
  const templateRows = buildLiquidPageTemplatesConfig({
    productType: "multi-product",
    pageType,
    productData: pageType === "product-page" ? buildSimmerDemoProduct() : null,
    detectedCategory: "home_kitchen",
    selectedTemplate: 1,
    stylePreferences,
    categoryDefaults: getCategoryTemplate1Defaults("home_kitchen"),
    homeData: buildSimmerHomeData(),
    marketType: "prepaid",
    storeTemplatePack: "simmer",
    collectionProducts: buildSimmerDemoGridProducts(),
  });
  const html = await renderTemplateRows(templateRows, {
    cssContent: buildDynamicCss(stylePreferences, getCssContentForPreviewType("entire-store")),
    jsContent: getJsContentForPreviewType("entire-store"),
    reinitHooks: getReinitHooksForPreviewType("entire-store"),
  });
  const file = path.join(tmpDir, `${pageType}.html`);
  fs.writeFileSync(file, withLocalAssetPaths(html), "utf8");
  return file;
}

async function openPage(browser, file, width, deviceScaleFactor = 1) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor });
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  // The newsletter popup opens after a few seconds, which would cover a slow screenshot.
  await page.addInitScript(() => { try { localStorage.setItem("sm-popup-off", "1"); } catch (e) {} });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load", timeout: 30000 });
  await page.evaluate(async () => {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
    document.head.appendChild(style);
    // A screenshot never scrolls, so show everything the scroll reveals would.
    document.querySelectorAll("[data-sm-reveal]").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; });
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
  });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  return { page, errors, overflow };
}

async function main() {
  const { chromium } = await import("playwright");
  const checkAt = process.argv.indexOf("--check");
  const checkDir = checkAt > -1 ? process.argv[checkAt + 1] : null;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "simmer-previews-"));
  const browser = await chromium.launch({ headless: true });
  try {
    const home = await renderPage("home-page", tmpDir);
    const { page } = await openPage(browser, home, 1280);
    await page.screenshot({ path: path.join(OUT_DIR, "store.jpg"), type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    await page.screenshot({ path: path.join(OUT_DIR, "store.eye.jpg"), type: "jpeg", quality: 74, fullPage: true });
    await page.close();
    // The desktop page at 720px wide, for the small dashboard cards.
    const small = await openPage(browser, home, 1280, 0.5625);
    await small.page.screenshot({ path: path.join(OUT_DIR, "store.eye-sm.jpg"), type: "jpeg", quality: 70, fullPage: true });
    await small.page.close();

    if (checkDir) {
      fs.mkdirSync(checkDir, { recursive: true });
      for (const pageType of ["home-page", "collection", "list-collections", "product-page", "faq-page"]) {
        const file = await renderPage(pageType, tmpDir);
        for (const width of [1440, 390]) {
          const shot = await openPage(browser, file, width);
          await shot.page.screenshot({ path: path.join(checkDir, `${pageType}-${width}.jpg`), type: "jpeg", quality: 80, fullPage: true });
          console.log(`${pageType} ${width}px: horizontal overflow ${shot.overflow}px, script errors ${JSON.stringify(shot.errors)}`);
          await shot.page.close();
        }
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

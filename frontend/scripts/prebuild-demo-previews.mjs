#!/usr/bin/env node
/**
 * Prebuild demo Liquid HTML for theme cards / eye modals.
 *
 * Usage (from frontend/):
 *   npx vite-node scripts/prebuild-demo-previews.mjs
 *   npx vite-node scripts/prebuild-demo-previews.mjs --category general
 *   npx vite-node scripts/prebuild-demo-previews.mjs --dry-run
 *
 * Writes to: scripts/demo-preview-out/<DEMO_PREVIEW_VERSION>/...
 * Also writes:
 *   .jpg     — card thumb (1280×720)
 *   .eye.jpg — taller eye-modal poster (full page, capped)
 * unless --skip-thumbs.
 *
 * Prefer: npm run sync:demo-previews  (bump + build + upload)
 * Watch:  npm run watch:demo-previews
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { renderTemplateRows } from "../app/utils/liquid.server.js";
import {
  getCssContentForPreviewType,
  getJsContentForPreviewType,
  getReinitHooksForPreviewType,
} from "../app/utils/theme-content.js";
import { buildDynamicCss } from "../app/utils/stylePreferences.js";
import { getCategoryTemplate1Defaults } from "../app/lib/categoryHomeDefaults.js";
import { getHomeDataForPreview } from "../app/routes/_app.generate_store/store/utils/default-magic-responses/home-data.js";
import { buildLiquidPageTemplatesConfig } from "../app/routes/_app.generate_store/store/utils/storeTemplatesConfiq.js";
import { buildStorePremiumPdpPreview } from "../app/routes/_app.generate_store/store/utils/buildStorePremiumPdpPreview.js";
import {
  buildLuminousDemoGridProducts,
  buildLuminousHomeData,
} from "../app/routes/_app.generate_store/store/utils/buildLuminousDemo.js";
import { buildPulseProductHomeData } from "../app/routes/_app.generate_store/store/utils/buildPulseProductHomeData.js";
import { buildEclipseProductHomeData } from "../app/routes/_app.generate_store/store/utils/buildEclipseProductHomeData.js";
import {
  buildPremiumMultiGridProducts,
  buildPremiumMultiHomeData,
} from "../app/routes/_app.generate_store/store/utils/buildPremiumMultiHome.js";
import { buildLinenHomeProductPageData } from "../app/routes/_app.generate_store/store/utils/buildLinenHomeProductPage.js";
import { buildVelvetHomeProductPageData } from "../app/routes/_app.generate_store/store/utils/buildVelvetHomeProductPage.js";
import { aiResponseMapping, DEFAULT_MAGIC_RESPONSE } from "../app/routes/_app.generate_pdp/product-page/utils/productAiResponeMapping.js";
import { generateTemplateConfig } from "../app/routes/_app.generate_pdp/product-page/utils/productTemplatesConfig.js";
import { getDefaultColor, getDefaultMagicResponses, getProductImages } from "../app/routes/_app.generate_pdp/product-page/utils/default-magic-responses/index.js";
import {
  DEMO_PREVIEW_VERSION,
  STORE_DEMO_VARIANTS,
  PDP_DEMO_VARIANTS,
} from "../app/lib/demoPreviewUrls.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_ROOT = path.join(__dirname, "demo-preview-out", DEMO_PREVIEW_VERSION);

const CATEGORIES = [
  "general",
  "fashion",
  "health_beauty",
  "home_kitchen",
  "kids_toys",
  "car_accessories",
];

function parseArgs(argv) {
  const args = { dryRun: false, category: null, skipThumbs: false, variant: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    if (argv[i] === "--skip-thumbs") args.skipThumbs = true;
    if (argv[i] === "--category" && argv[i + 1]) {
      args.category = argv[++i];
    }
    if (argv[i] === "--variant" && argv[i + 1]) {
      args.variant = argv[++i];
    }
  }
  return args;
}

async function renderHtml(templateRows, liquidPreviewType, stylePreferences = null) {
  const cssContent = buildDynamicCss(
    stylePreferences,
    getCssContentForPreviewType(liquidPreviewType),
  );
  return renderTemplateRows(templateRows, {
    cssContent,
    jsContent: getJsContentForPreviewType(liquidPreviewType),
    reinitHooks: getReinitHooksForPreviewType(liquidPreviewType),
  });
}

function defaultStyle(category) {
  const defaults = getCategoryTemplate1Defaults(category) || {};
  return {
    dynamicColor: getDefaultColor(category) || "#2563EB",
    headingFont: defaults.headingFont || "Montserrat",
    bodyFont: defaults.bodyFont || "Inter",
  };
}

function buildStoreHomeRows({
  category,
  pack,
  productType,
  marketType = "cod",
  omitCheckoutBlocks = null,
}) {
  const stylePreferences = defaultStyle(category);
  // Classic prepaid theme uses dedicated demo assets (pack key classic-prepaid).
  const homePack =
    marketType === "prepaid" && pack === "classic" ? "classic-prepaid" : pack;
  const homeData = getHomeDataForPreview(
    productType === "multi-product" ? "multi" : "single",
    category,
    homePack,
  );
  const categoryDefaults = getCategoryTemplate1Defaults(category);
  const productImages = getProductImages(category) || {};
  const urls = (
    marketType === "prepaid"
      ? [
          homeData?.images?.product_image_1,
          homeData?.images?.product_image_2,
          homeData?.images?.product_image_3,
          homeData?.images?.feature_image,
          homeData?.images?.product_base_image,
        ]
      : [
          productImages.product_image_1,
          productImages.product_image_2,
          productImages.product_image_3,
          homeData?.images?.product_image_1,
          homeData?.images?.product_base_image,
        ]
  ).filter((u) => typeof u === "string" && u.trim().startsWith("http"));
  const featured = urls[0] || null;
  const productData =
    marketType === "prepaid"
      ? {
          id: "demo-prepaid-home-product",
          title: homeData?.text?.banner_heading || "Featured Product",
          description:
            homeData?.text?.checkout_product_details ||
            homeData?.text?.image_with_text_description ||
            "Demo product for the prepaid single-store homepage checkout.",
          featuredImage: featured ? { url: featured, altText: "Product" } : null,
          images: {
            edges: urls.map((url) => ({ node: { url, altText: "Product" } })),
          },
          variants: {
            edges: [{ node: { id: "demo-variant", price: "29.99", compareAtPrice: "39.99" } }],
          },
        }
      : null;

  return {
    liquidPreviewType: pack === "cinematic" ? "cinematic-home" : "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType,
      pageType: "home-page",
      productData,
      detectedCategory: category,
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults,
      homeData,
      marketType,
      storeTemplatePack: pack,
      collectionProducts: productType === "multi-product" ? [] : null,
      omitCheckoutBlocks,
    }),
  };
}

function buildLuminousHomeRows({ category }) {
  const stylePreferences = defaultStyle(category);
  const homeData = buildLuminousHomeData(category);
  const categoryDefaults = getCategoryTemplate1Defaults(category);
  return {
    liquidPreviewType: "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType: "multi-product",
      pageType: "home-page",
      productData: null,
      detectedCategory: category,
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults,
      homeData,
      marketType: "cod",
      storeTemplatePack: "classic",
      collectionProducts: buildLuminousDemoGridProducts(category) || [],
    }),
  };
}

function buildCustomHomeRows({
  category,
  pack,
  productType,
  homeData,
  collectionProducts = null,
  omitCheckoutBlocks = null,
  marketType = "prepaid",
}) {
  const stylePreferences = defaultStyle(category);
  const categoryDefaults = getCategoryTemplate1Defaults(category);
  return {
    liquidPreviewType: pack === "cinematic" ? "cinematic-home" : "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType,
      pageType: "home-page",
      productData: null,
      detectedCategory: category,
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults,
      homeData,
      marketType,
      storeTemplatePack: pack,
      collectionProducts,
      omitCheckoutBlocks,
    }),
  };
}

function buildThemedProductRows({ category, template, productPageData }) {
  const stylePreferences = defaultStyle(category);
  const { templateRows } = buildStorePremiumPdpPreview({
    storeCategory: category,
    productPageData,
    shopifyProduct: null,
    stylePreferences,
    selectedTemplate: template,
  });
  return {
    liquidPreviewType: "landing-page",
    stylePreferences,
    templateRows,
  };
}

function buildStoreProductRows({ category, template }) {
  const stylePreferences = defaultStyle(category);
  const { templateRows } = buildStorePremiumPdpPreview({
    storeCategory: category,
    productPageData: null,
    shopifyProduct: null,
    stylePreferences,
    selectedTemplate: template,
  });
  return {
    liquidPreviewType: "landing-page",
    stylePreferences,
    templateRows,
  };
}

/** Single prepaid: checkout-on-page default product hero (not Sleek/Vibe). */
function buildStorePrepaidProductRows({ category }) {
  const stylePreferences = defaultStyle(category);
  const categoryDefaults = getCategoryTemplate1Defaults(category);
  const magic = getDefaultMagicResponses(category) || {};
  // Use Classic prepaid demo gallery (not Sleek/Vibe/COD classic product images).
  const home = getHomeDataForPreview("single", category, "classic-prepaid");
  const productImages = home?.images || {};
  const urls = [
    productImages.product_image_1,
    productImages.product_image_2,
    productImages.product_image_3,
    productImages.feature_image,
    productImages.product_base_image,
  ].filter((u) => typeof u === "string" && u.trim());

  const featured = urls[0] || null;
  const productData = {
    id: "demo-prepaid-product",
    title:
      home?.text?.banner_heading ||
      magic?.text?.product_title ||
      magic?.text?.hero_heading ||
      "Featured Product",
    description:
      home?.text?.checkout_product_details ||
      magic?.text?.product_description ||
      magic?.text?.hero_subheading ||
      home?.text?.image_with_text_description ||
      "Demo product for the prepaid single-store product page.",
    featuredImage: featured ? { url: featured, altText: "Product" } : null,
    images: {
      edges: urls.map((url) => ({ node: { url, altText: "Product" } })),
    },
    variants: {
      edges: [
        {
          node: {
            id: "demo-prepaid-variant",
            price: "29.99",
            compareAtPrice: "39.99",
          },
        },
      ],
    },
  };

  return {
    liquidPreviewType: "entire-store",
    stylePreferences,
    templateRows: buildLiquidPageTemplatesConfig({
      productType: "single-product",
      pageType: "product-page",
      productData,
      detectedCategory: category,
      selectedTemplate: 1,
      stylePreferences,
      categoryDefaults,
      homeData: {},
      marketType: "prepaid",
      storeTemplatePack: "classic",
    }),
  };
}

function buildPdpRows({ category, template }) {
  const categoryDefaults = getDefaultMagicResponses(category, { template });
  const hex = getDefaultColor(category, { template });
  const form = {
    ...DEFAULT_MAGIC_RESPONSE,
    images: categoryDefaults?.images || {},
    text: categoryDefaults?.text || {},
    selected_color: hex || undefined,
    color_schemes: hex ? [hex] : [],
  };
  const productData = aiResponseMapping(form);
  const stylePreferences = defaultStyle(category);
  if (hex) stylePreferences.dynamicColor = hex;
  return {
    liquidPreviewType: "landing-page",
    stylePreferences,
    templateRows: generateTemplateConfig(category, productData, template, form),
  };
}

function writeFile(relPath, html, dryRun) {
  const abs = path.join(OUT_ROOT, relPath);
  if (dryRun) {
    console.log(`[dry-run] would write ${abs} (${html.length} bytes)`);
    return abs;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html, "utf8");
  console.log(`wrote ${path.relative(ROOT, abs)} (${html.length} bytes)`);
  return abs;
}

/**
 * Capture card (.jpg) + eye-modal (.eye.jpg) screenshots from prebuilt HTML.
 * Requires: npm i -D playwright && npx playwright install chromium
 * Pass --skip-thumbs to only write HTML.
 */
async function captureThumbs(htmlPath, dryRun, { settleFirstSlide = false } = {}) {
  if (dryRun || !htmlPath) return { card: null, eye: null };
  const thumbPath = htmlPath.replace(/\.html$/i, ".jpg");
  const eyePath = htmlPath.replace(/\.html$/i, ".eye.jpg");
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      });
      await page.goto(`file://${htmlPath}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForTimeout(500);
      if (settleFirstSlide) {
        const extraCss = htmlPath.includes("/health_beauty.")
          ? `
            [data-hero-peek-slider] .hs-overlay {
              background: linear-gradient(
                90deg,
                rgba(12, 10, 8, 0.78) 0%,
                rgba(12, 10, 8, 0.64) 36%,
                rgba(12, 10, 8, 0.2) 58%,
                rgba(12, 10, 8, 0) 74%
              ) !important;
            }
            [data-hero-peek-slider] .hs-eyebrow,
            [data-hero-peek-slider] h2 {
              text-shadow: 0 2px 18px rgba(0, 0, 0, 0.9) !important;
            }
          `
          : "";
        await page.evaluate(async (extraCss) => {
          const lock = document.createElement("style");
          lock.textContent = `
            [data-hero-peek-slider] .hs-slide,
            [data-hero-peek-slider] .hs-bg-img,
            [data-hero-peek-slider] .hs-content-box {
              transition: none !important;
              animation: none !important;
            }
            [data-hero-peek-slider] .hs-slide:not(:first-child) {
              opacity: 0 !important;
              visibility: hidden !important;
              transform: none !important;
            }
            [data-hero-peek-slider] .hs-slide:first-child {
              opacity: 1 !important;
              visibility: visible !important;
              transform: none !important;
              z-index: 5 !important;
            }
            [data-hero-peek-slider] .hs-bg-img {
              transform: none !important;
            }
            [data-hero-peek-slider] .hs-slide:first-child .hs-content-box {
              opacity: 1 !important;
              visibility: visible !important;
            }
            ${extraCss}
          `;
          document.head.appendChild(lock);
          document.querySelectorAll("[data-hero-peek-slider] .hs-slide").forEach((slide, index) => {
            slide.classList.toggle("active", index === 0);
            slide.classList.remove("prev", "next");
          });
          if (document.fonts?.ready) await document.fonts.ready;
          const imgs = [...document.querySelectorAll("[data-hero-peek-slider] .hs-slide:first-child img")];
          await Promise.all(
            imgs.map((img) =>
              img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
            ),
          );
        }, extraCss);
        await page.waitForTimeout(400);
      }
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      });
      await page.screenshot({
        path: thumbPath,
        type: "jpeg",
        quality: 82,
        clip: { x: 0, y: 0, width: 1280, height: 720 },
      });

      // Tall eye poster for instant modal paint (HTML still loads deferred).
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: eyePath,
        type: "jpeg",
        quality: 78,
        fullPage: true,
      });
    } finally {
      await browser.close();
    }
    console.log(`thumb ${path.relative(ROOT, thumbPath)}`);
    console.log(`eye   ${path.relative(ROOT, eyePath)}`);
    return { card: thumbPath, eye: eyePath };
  } catch (err) {
    console.warn(
      `[thumb] skipped (${err?.message || err}). Install: npm i -D playwright && npx playwright install chromium`,
    );
    return { card: null, eye: null };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cats = args.category
    ? [String(args.category).trim().toLowerCase().replaceAll(" ", "_")]
    : CATEGORIES;

  console.log(`Demo preview version: ${DEMO_PREVIEW_VERSION}`);
  console.log(`Categories: ${cats.join(", ")}`);
  console.log(`Output: ${OUT_ROOT}`);

  const jobs = [];

  for (const category of cats) {
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.CLASSIC_HOME}/${category}.html`,
      build: () => buildStoreHomeRows({ category, pack: "classic", productType: "single-product", marketType: "cod" }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.LINEN_HOME}/${category}.html`,
      build: () =>
        buildStoreHomeRows({
          category,
          pack: "classic",
          productType: "single-product",
          marketType: "cod",
          omitCheckoutBlocks: true,
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.CLASSIC_HOME_PREPAID}/${category}.html`,
      settleFirstSlide: true,
      build: () =>
        buildStoreHomeRows({
          category,
          pack: "classic",
          productType: "single-product",
          marketType: "prepaid",
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.CINEMATIC_HOME}/${category}.html`,
      build: () => buildStoreHomeRows({ category, pack: "cinematic", productType: "single-product", marketType: "cod" }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.AMOUR_HOME}/${category}.html`,
      build: () =>
        buildStoreHomeRows({
          category,
          pack: "amour",
          productType: "single-product",
          marketType: "prepaid",
          omitCheckoutBlocks: true,
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.MULTI_HOME}/${category}.html`,
      build: () => buildStoreHomeRows({ category, pack: "classic", productType: "multi-product", marketType: "cod" }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.LUMINOUS_HOME}/${category}.html`,
      settleFirstSlide: true,
      build: () => buildLuminousHomeRows({ category }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.PULSE_HOME}/${category}.html`,
      build: () =>
        buildCustomHomeRows({
          category,
          pack: "classic",
          productType: "single-product",
          homeData: buildPulseProductHomeData(category),
          omitCheckoutBlocks: true,
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.ECLIPSE_HOME}/${category}.html`,
      build: () =>
        buildCustomHomeRows({
          category,
          pack: "cinematic",
          productType: "single-product",
          homeData: buildEclipseProductHomeData(category),
          omitCheckoutBlocks: true,
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.COLLECTIVE_HOME}/${category}.html`,
      build: () =>
        buildCustomHomeRows({
          category,
          pack: "classic",
          productType: "multi-product",
          homeData: buildPremiumMultiHomeData(category, 1),
          collectionProducts: buildPremiumMultiGridProducts(category, 1),
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.MERIDIAN_HOME}/${category}.html`,
      build: () =>
        buildCustomHomeRows({
          category,
          pack: "classic",
          productType: "multi-product",
          homeData: buildPremiumMultiHomeData(category, 2),
          collectionProducts: buildPremiumMultiGridProducts(category, 2),
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.PRODUCT_SLEEK}/${category}.html`,
      build: () => buildStoreProductRows({ category, template: 1 }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.PRODUCT_VIBE}/${category}.html`,
      build: () => buildStoreProductRows({ category, template: 2 }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.PRODUCT_PREPAID}/${category}.html`,
      build: () => buildStorePrepaidProductRows({ category }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.LINEN_PDP}/${category}.html`,
      build: () =>
        buildThemedProductRows({
          category,
          template: 1,
          productPageData: buildLinenHomeProductPageData(category),
        }),
    });
    jobs.push({
      rel: `store/${STORE_DEMO_VARIANTS.VELVET_PDP}/${category}.html`,
      build: () =>
        buildThemedProductRows({
          category,
          template: 2,
          productPageData: buildVelvetHomeProductPageData(category),
        }),
    });
    jobs.push({
      rel: `pdp/${PDP_DEMO_VARIANTS.SLEEK}/${category}.html`,
      build: () => buildPdpRows({ category, template: 1 }),
    });
    jobs.push({
      rel: `pdp/${PDP_DEMO_VARIANTS.VIBE}/${category}.html`,
      build: () => buildPdpRows({ category, template: 2 }),
    });
  }

  let ok = 0;
  let fail = 0;
  let thumbs = 0;
  let eyeThumbs = 0;
  const selected = jobs.filter((job) =>
    args.variant ? job.rel.includes(`/${args.variant}/`) : true,
  );
  if (args.variant) {
    console.log(`Variant filter: ${args.variant} (${selected.length} jobs)`);
  }
  for (const job of selected) {
    try {
      const { templateRows, liquidPreviewType, stylePreferences } = job.build();
      if (!Array.isArray(templateRows) || templateRows.length === 0) {
        throw new Error("empty templateRows");
      }
      const html = await renderHtml(templateRows, liquidPreviewType, stylePreferences);
      if (!html || html.length < 100) throw new Error("html too short");
      const abs = writeFile(job.rel, html, args.dryRun);
      ok += 1;
      if (!args.skipThumbs && abs) {
        const { card, eye } = await captureThumbs(abs, args.dryRun, {
          settleFirstSlide: Boolean(job.settleFirstSlide),
        });
        if (card) thumbs += 1;
        if (eye) eyeThumbs += 1;
      }
    } catch (err) {
      fail += 1;
      console.error(`FAILED ${job.rel}:`, err?.message || err);
    }
  }

  const manifest = {
    version: DEMO_PREVIEW_VERSION,
    generatedAt: new Date().toISOString(),
    categories: cats,
    countOk: ok,
    countFail: fail,
    countThumbs: thumbs,
    countEyeThumbs: eyeThumbs,
  };
  if (!args.dryRun) {
    fs.mkdirSync(OUT_ROOT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT_ROOT, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
  }
  console.log(`\nDone. ok=${ok} fail=${fail} thumbs=${thumbs} eye=${eyeThumbs}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

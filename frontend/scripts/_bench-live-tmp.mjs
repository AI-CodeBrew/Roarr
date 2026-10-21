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

const category = "general";
const pages = [
  ["QuickCart home", () => buildStoreHomeRows({ category, pack: "classic", productType: "single-product", marketType: "prepaid" })],
  ["Linen home", () => buildStoreHomeRows({ category, pack: "classic", productType: "single-product", marketType: "cod", omitCheckoutBlocks: true })],
  ["Linen product", () => buildThemedProductRows({ category, template: 1, productPageData: buildLinenHomeProductPageData(category) })],
  ["Pulse home", () => buildCustomHomeRows({ category, pack: "classic", productType: "single-product", homeData: buildPulseProductHomeData(category), omitCheckoutBlocks: true })],
  ["Pulse product", () => buildStoreProductRows({ category, template: 2 })],
  ["Eclipse home", () => buildCustomHomeRows({ category, pack: "cinematic", productType: "single-product", homeData: buildEclipseProductHomeData(category), omitCheckoutBlocks: true })],
  ["Eclipse product", () => buildStoreProductRows({ category, template: 1 })],
  ["Velvet home", () => buildStoreHomeRows({ category, pack: "cinematic", productType: "single-product", marketType: "cod", omitCheckoutBlocks: true })],
  ["Velvet product", () => buildThemedProductRows({ category, template: 2, productPageData: buildVelvetHomeProductPageData(category) })],
  ["Luminous home", () => buildLuminousHomeRows({ category })],
  ["Collective home", () => buildCustomHomeRows({ category, pack: "classic", productType: "multi-product", homeData: buildPremiumMultiHomeData(category, 1), collectionProducts: buildPremiumMultiGridProducts(category, 1) })],
  ["Collective product", () => buildStoreProductRows({ category, template: 1 })],
  ["Meridian home", () => buildCustomHomeRows({ category, pack: "classic", productType: "multi-product", homeData: buildPremiumMultiHomeData(category, 2), collectionProducts: buildPremiumMultiGridProducts(category, 2) })],
  ["Meridian product", () => buildStoreProductRows({ category, template: 2 })],
  ["Sleek product page", () => buildPdpRows({ category, template: 1 })],
  ["Vibe product page", () => buildPdpRows({ category, template: 2 })],
];

function postBytes(built) {
  return Buffer.byteLength(JSON.stringify({
    templateRows: built.templateRows,
    stylePreferences: built.stylePreferences,
    type: built.liquidPreviewType,
  }));
}

async function timeRender(built) {
  const t0 = performance.now();
  const html = await renderHtml(built.templateRows, built.liquidPreviewType, built.stylePreferences);
  const ms = performance.now() - t0;
  return { ms, htmlBytes: Buffer.byteLength(html || "") };
}

const built = pages.map(([name, build]) => {
  const t0 = performance.now();
  const page = build();
  const buildMs = performance.now() - t0;
  return { name, page, buildMs, body: postBytes(page) };
});

// Warm the Liquid compiler, then time each page cold and again.
await timeRender(built[0].page);

const rows = [];
for (const item of built) {
  const cold = await timeRender(item.page);
  const warm = await timeRender(item.page);
  rows.push({ ...item, cold: cold.ms, warm: warm.ms, html: cold.htmlBytes });
  console.log([
    item.name,
    `build ${item.buildMs.toFixed(1)}ms`,
    `cold ${cold.ms.toFixed(1)}ms`,
    `warm ${warm.ms.toFixed(1)}ms`,
    `html ${cold.htmlBytes}`,
    `post ${item.body}`,
  ].join(" | "));
}

#!/usr/bin/env node
/**
 * Demo art for the Atelier product page card and preview: ten renders of the same fragrance bottle,
 * one per image slot the template reads, modelled and lit in three.js and rendered locally in
 * headless Chromium — no image API, no photos.
 *
 * It reuses the bottle, materials and scenes from build-maison-art.mjs (the page source is read from
 * that file) and adds three Atelier-only scenes: a dark centred portrait for the hero, a side profile
 * and a top-down flat lay.
 *
 * Usage (from frontend/):
 *   node scripts/build-atelier-art.mjs                      (all ten)
 *   node scripts/build-atelier-art.mjs product_image_4      (some)
 *
 * Writes public/atelier-assets/*.jpg, named after the metafield keys the demo copy in
 * default-magic-responses/atelier.js points at. Rebuild the card screenshots afterwards with
 * `npx vite-node scripts/build-product-previews.mjs atelier`.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "atelier-assets");
const MAISON = fs.readFileSync(path.join(__dirname, "build-maison-art.mjs"), "utf8");

/** output file → [scene, width, height] */
const OUTPUTS = {
  product_image_1: ["piece", 1200, 1500],
  product_image_2: ["gallery-1", 1200, 1500],
  product_image_3: ["gallery-2", 1200, 1500],
  product_image_4: ["side", 1200, 1500],
  product_image_5: ["flatlay", 1200, 1500],
  product_highlight_1: ["gallery-3", 1200, 1500],
  product_highlight_2: ["inline", 600, 600],
  product_highlight_3: ["craft", 1200, 1200],
  feature_image: ["hero", 2000, 1125],
  product_impact_image: ["impact", 1200, 1500],
};

const EXTRA_SCENES = String.raw`
  impact(w, h) {
    const scene = stage({ wall: "#2E2620", floor: "#3B3129", dark: true });
    windowLight(scene, { pos: [-2.5, 4.5, 3.5], target: [0, 1, -2.4], intensity: 150, color: "#FFDDB0", angle: 0.5 });
    scene.add(box(3.4, 0.5, 1.7, M.matte("#4A3D31", 0.7, travertine("#5A4A3B")), 0, 0, 0));
    wallWash(scene, -0.2, -2.4, 190);
    const b = bottle(); b.position.set(0, 0.5, 0.1); b.rotation.y = -0.3; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0, 1.35, 6.4], [0, 1.2, 0], 22), vignette: 0.3 };
  },
  side(w, h) {
    const scene = stage({ wall: "#E4D9C6", floor: "#D8CBB4" });
    windowLight(scene, { pos: [-5, 5, 3], target: [0, 0.9, 0], intensity: 250, gobo: false, angle: 0.5 });
    scene.add(box(2.6, 0.08, 1.4, M.matte("#F2EFEA", 0.35, marble()), 0, 0, 0, 0.02));
    const b = bottle(); b.position.y = 0.08; b.rotation.y = -1.18; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0.2, 1.05, 7.2], [0, 1.0, 0], 22), vignette: 0.15 };
  },
  flatlay(w, h) {
    const scene = stage({ wall: "#E8DECD", floor: "#E3D8C5", floorMap: linen() });
    windowLight(scene, { pos: [-4, 6, 3], target: [0, 0, 0.6], intensity: 280, angle: 0.55 });
    const holder = new THREE.Group();
    const b = bottle(); b.rotation.x = -Math.PI / 2; b.position.set(0, 0.29, 0.85);
    holder.add(b); holder.rotation.y = 0.55; holder.position.set(-0.2, 0, 0.1);
    scene.add(holder);
    const c = cap(); c.position.set(1.55, 0, 0.35); c.rotation.y = 0.4; scene.add(c);
    scene.add(ribbon([new THREE.Vector3(-2.2, 0.01, -0.4), new THREE.Vector3(-0.6, 0.03, -0.9), new THREE.Vector3(0.9, 0.02, -0.5), new THREE.Vector3(2.2, 0.04, -1.0)], 0.2, "#E9DABA"));
    return { scene, camera: cameraFor(w, h, [0, 7.4, 1.9], [0, 0, 0.3], 26), vignette: 0.14 };
  },
`;

let PAGE = MAISON.slice(MAISON.indexOf("const PAGE = String.raw`") + "const PAGE = String.raw`".length);
PAGE = PAGE.slice(0, PAGE.indexOf("`;\n\nasync function main"));
if (!PAGE.includes("const SCENES = {")) throw new Error("build-maison-art.mjs layout changed: cannot find SCENES");
PAGE = PAGE
  .replace("const SCENES = {", "const SCENES = {" + EXTRA_SCENES)
  .replace('name === "craft" || name === "banner"', '["craft", "banner", "impact"].includes(name)');

async function main() {
  const { chromium } = await import("playwright");
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "atelier-art-"));
  const pagePath = path.join(tmp, "render.html");
  fs.writeFileSync(pagePath, PAGE, "utf8");
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("page error:", e.message));
    await page.goto(pathToFileURL(pagePath).href, { waitUntil: "load" });
    await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
    for (const [name, [scene, w, h]] of Object.entries(OUTPUTS)) {
      if (only.length && !only.includes(name)) continue;
      const t0 = Date.now();
      const dataUrl = await page.evaluate(([n, a, b]) => window.renderScene(n, a, b), [scene, w, h]);
      const file = path.join(OUT_DIR, `${name}.jpg`);
      fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
      console.log(`atelier-assets/${name}.jpg ${w}x${h} ${Math.round(fs.statSync(file).size / 1024)} KB (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

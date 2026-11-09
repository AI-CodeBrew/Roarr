#!/usr/bin/env node
/**
 * Demo art for the Tempo store template card and preview: one pair of wireless headphones in
 * nine bright scenes (white-background packshots that blend into the Tempo sections, plus three warm lifestyle shots), modelled and lit in three.js and rendered locally in headless
 * Chromium — no image API, no photos.
 *
 * Usage (from frontend/):
 *   node scripts/build-tempo-art.mjs            (all scenes)
 *   node scripts/build-tempo-art.mjs hero-1     (some scenes)
 *
 * Writes public/tempo-assets/*.jpg. three.js is loaded from jsDelivr (pinned) by the render
 * page only; the app itself never loads it. The demo copy in
 * app/routes/_app.generate_store/store/utils/buildTempoDemo.js points at these files; rebuild
 * the card screenshots afterwards with `npx vite-node scripts/build-tempo-previews.mjs`.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "tempo-assets");

/** name → [width, height]; names are the files buildTempoDemo.js references. */
const SIZES = {
  "hero-1": [1200, 1500],
  "hero-2": [1200, 1500],
  "hero-3": [1200, 1500],
  product: [1200, 1200],
  detail: [1200, 1200],
  showcase: [1200, 1200],
  "story-1": [1200, 900],
  "story-2": [1200, 900],
  "story-3": [1200, 900],
};

const PAGE = String.raw`<!doctype html>
<html><head>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/"}}</script>
</head><body style="margin:0">
<script type="module">
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const SS = 1.5; // supersampling
const LIME = 0xFC6539;
let seed = 11;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/* ------------------------------------------------------------ textures */

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const gradientBg = (top, bottom, glow) => canvasTex(16, 512, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

/* ------------------------------------------------------------ materials */

const M = {
  shell: () => new THREE.MeshPhysicalMaterial({ color: 0x15181f, roughness: 0.34, metalness: 0.12, clearcoat: 0.7, clearcoatRoughness: 0.22, side: THREE.DoubleSide }),
  soft: () => new THREE.MeshStandardMaterial({ color: 0x1b1e25, roughness: 0.92, metalness: 0 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0xa3abb6, roughness: 0.26, metalness: 1 }),
  lime: () => new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: 0.85, roughness: 0.45, metalness: 0 }),
};

/* ------------------------------------------------------------ the headphones */

function cup(side) {
  const g = new THREE.Group();
  const prof = [[0, 0.17], [0.46, 0.17], [0.55, 0.14], [0.6, 0.07], [0.6, -0.07], [0.56, -0.14], [0.5, -0.17], [0, -0.17]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), M.shell());
  shell.castShadow = shell.receiveShadow = true;
  shell.rotation.z = -Math.PI / 2 * side; // lathe axis (y) → points outward on +x for side=1
  g.add(shell);
  // accent ring and brushed centre cap on the outer face
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.022, 20, 96), M.lime());
  ring.rotation.y = Math.PI / 2; ring.position.x = 0.172 * side;
  g.add(ring);
  const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 64), M.metal());
  capMesh.rotation.z = Math.PI / 2; capMesh.position.x = 0.178 * side;
  g.add(capMesh);
  // cushion on the inner face
  const pad = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 28, 72), M.soft());
  pad.rotation.y = Math.PI / 2; pad.scale.set(1, 1, 0.8); pad.position.x = -0.2 * side;
  pad.castShadow = true;
  g.add(pad);
  return g;
}

function headphones() {
  const g = new THREE.Group();
  const R = 1.15;
  const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.075, 24, 120, Math.PI), M.shell());
  band.castShadow = true; g.add(band);
  const cushion = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.11, 24, 60, 1.25), M.soft());
  cushion.rotation.z = Math.PI / 2 - 0.625; cushion.castShadow = true; g.add(cushion);
  for (const s of [-1, 1]) {
    const slider = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 20), M.metal());
    slider.position.set(R * s, -0.2, 0); slider.castShadow = true; g.add(slider);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 16, 40, Math.PI), M.metal());
    yoke.position.set(R * s, -0.5, 0); yoke.rotation.z = Math.PI; yoke.rotation.y = Math.PI / 2; g.add(yoke);
    const c = cup(s); c.position.set((R + 0.02) * s, -0.82, 0); g.add(c);
  }
  return g;
}

/* ------------------------------------------------------------ props */

/** Shadow-catcher ground: only the cast shadow is drawn, so there is no horizon line against the backdrop. */
function ground(scene, color, _rough, _metal, y = -1.5) {
  const lum = ((color >> 16) & 255) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: lum < 90 ? 0.75 : 0.26 }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  scene.add(m);
  return m;
}

function slab(w, h, d, color, rough = 0.5) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, Math.min(h, d) * 0.12), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.1 }));
  m.castShadow = m.receiveShadow = true; return m;
}

function phone() {
  const g = new THREE.Group();
  const body = slab(0.9, 1.8, 0.09, 0x0d0f13, 0.3); g.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.7), new THREE.MeshStandardMaterial({ color: 0x0a1018, emissive: 0x16222f, emissiveIntensity: 0.9, roughness: 0.15 }));
  screen.position.z = 0.047; g.add(screen);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: LIME }));
  bar.position.set(0, -0.2, 0.049); g.add(bar);
  return g;
}

function mug() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.8, 48), new THREE.MeshStandardMaterial({ color: 0xF4EFE9, roughness: 0.4, metalness: 0.05 }));
  body.castShadow = true; g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 16, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0xF4EFE9, roughness: 0.4 }));
  handle.position.set(0.42, 0, 0); handle.rotation.z = -Math.PI / 2; g.add(handle);
  return g;
}

function stand() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.1, 64), new THREE.MeshStandardMaterial({ color: 0x1a1e27, roughness: 0.3, metalness: 0.5 }));
  base.position.y = 0.05; base.castShadow = base.receiveShadow = true; g.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 24), M.metal());
  post.position.y = 0.95; post.castShadow = true; g.add(post);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 20, 48, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1e27, roughness: 0.5, metalness: 0.3 }));
  hook.position.set(0, 1.8, 0); hook.castShadow = true; g.add(hook);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.018, 12, 96), M.lime());
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.11; g.add(ring);
  return g;
}

/* ------------------------------------------------------------ lights + camera */

function addLights(scene, { key = [-4, 6, 5], keyI = 3.2, rim = [4, 2, -4], rimI = 90, rimColor = LIME, fill = 0.35, shadowSize = 12 } = {}) {
  const k = new THREE.SpotLight(0xffffff, keyI * 100, 40, 0.55, 0.8, 1.6);
  k.position.set(...key); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); k.shadow.radius = 8; k.shadow.blurSamples = 16; k.shadow.bias = -0.0004;
  scene.add(k); scene.add(k.target);
  const r = new THREE.PointLight(rimColor, rimI, 30, 1.6); r.position.set(...rim); scene.add(r);
  scene.add(new THREE.AmbientLight(0xffffff, fill));
}

function cameraFor(w, h, pos, target, fov) {
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
  cam.position.set(...pos); cam.lookAt(...target); return cam;
}

function glow(scene, color, x, y, z, size, opacity) {
  const t = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.position.set(x, y, z); scene.add(s); return s;
}

/* ------------------------------------------------------------ scenes */

function laptop() {
  const g = new THREE.Group();
  const base = slab(3.0, 0.1, 2.0, 0x9aa1ab, 0.35); g.add(base);
  const lid = slab(3.0, 0.08, 1.95, 0x8d949e, 0.35); lid.position.set(0, 0.9, -1.0); lid.rotation.x = -1.7; g.add(lid);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.7), new THREE.MeshStandardMaterial({ color: 0xf4f6f8, emissive: 0xdfe6ee, emissiveIntensity: 0.6 }));
  scr.position.set(0, 0.9, -0.93); scr.rotation.x = -1.7; scr.translateZ(0.05); g.add(scr);
  return g;
}

function warmGround(scene, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0 }));
  m.rotation.x = -Math.PI / 2; m.position.y = -1.5; m.receiveShadow = true; scene.add(m);
}

const SCENES = {
  "hero-1": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [-4, 7, 6], keyI: 2.4, rim: [4, 2, -3], rimI: 24, rimColor: 0xffffff, fill: 0.8 });
    const hp = headphones(); hp.position.set(0, 0.1, 0); hp.rotation.set(0.08, 0.6, 0.02); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.6, 10.6], [0.1, -0.1, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  "hero-2": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [4, 7, 6], keyI: 2.4, rim: [-4, 2, -3], rimI: 24, rimColor: 0xffffff, fill: 0.8 });
    const hp = headphones(); hp.position.set(0, 0.0, 0); hp.rotation.set(-0.05, -0.85, 0.08); hp.scale.setScalar(1.08); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.5, 10.6], [-0.1, -0.1, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  "hero-3": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [0, 8, 7], keyI: 2.3, rim: [3, 2, -3], rimI: 24, rimColor: 0xffffff, fill: 0.85 });
    const hp = headphones(); hp.position.set(0, 0.05, 0); hp.rotation.set(0.04, 0.12, 0.0); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.45, 10.4], [0, -0.1, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  product: (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [-3, 7, 6], keyI: 2.3, rim: [3, 2, -3], rimI: 24, rimColor: 0xffffff, fill: 0.85 });
    const hp = headphones(); hp.position.set(0, 0.1, 0); hp.rotation.set(0.06, -0.55, 0.0); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.45, 8.4], [0.1, -0.05, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  detail: (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [-3, 6, 6], keyI: 2.4, rim: [4, 2, -2], rimI: 28, rimColor: 0xffffff, fill: 0.8 });
    const hp = headphones(); hp.position.set(0, 0.2, 0); hp.rotation.set(0.1, -1.15, 0.05); hp.scale.setScalar(1.25); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.9, 9.4], [0.2, -0.15, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  showcase: (w, h) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    ground(scene, 0xffffff, 0, 0, -1.55);
    addLights(scene, { key: [-3, 7, 6], keyI: 2.3, rim: [3, 2, -3], rimI: 24, rimColor: 0xffffff, fill: 0.85 });
    const hp = headphones(); hp.position.set(0, 0.15, 0); hp.rotation.set(0.05, 0.4, 0.0); scene.add(hp);
    return { scene, camera: cameraFor(w, h, [0, 0.35, 6.6], [0, -0.1, 0], 30), vignette: 0.0, vcolor: "255,255,255", env: 1.0 };
  },
  "story-1": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = gradientBg("#EFE4D6", "#E3D3BF");
    warmGround(scene, 0xCDB59A);
    addLights(scene, { key: [-4, 7, 3], keyI: 2.6, rim: [4, 3, -3], rimI: 30, rimColor: 0xffd9b8, fill: 0.7 });
    const lp = laptop(); lp.scale.setScalar(0.85); lp.position.set(-1.2, -1.45, -0.4); lp.rotation.y = 0.35; scene.add(lp);
    const hp = headphones(); hp.position.set(2.2, -1.15, 1.2); hp.rotation.set(-Math.PI / 2 + 0.05, 0, 0.9); hp.scale.setScalar(0.85); scene.add(hp);
    const mg = mug(); mg.position.set(-1.0, -1.1, 2.2); scene.add(mg);
    return { scene, camera: cameraFor(w, h, [0.4, 6.4, 5.8], [0.2, -1.1, 0.3], 34), vignette: 0.18, vcolor: "60,40,20", env: 0.8 };
  },
  "story-2": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = gradientBg("#DDE6EA", "#C8D5DB");
    warmGround(scene, 0xBFC9CE);
    addLights(scene, { key: [3, 7, 4], keyI: 2.6, rim: [-4, 3, -3], rimI: 30, rimColor: 0xffffff, fill: 0.75 });
    const bag = slab(3.2, 2.2, 1.5, 0xFF8A66, 0.8); bag.position.set(-0.8, -0.4, -0.3); bag.rotation.y = 0.25; scene.add(bag);
    const pocket = slab(2.3, 0.9, 0.2, 0xE9714E, 0.8); pocket.position.set(-0.95, -0.85, 0.55); pocket.rotation.y = 0.25; scene.add(pocket);
    const hp = headphones(); hp.position.set(2.5, -1.15, 1.1); hp.rotation.set(-Math.PI / 2 + 0.05, 0, -0.5); hp.scale.setScalar(0.85); scene.add(hp);
    const ph = phone(); ph.position.set(0.7, -1.43, 2.3); ph.rotation.set(-Math.PI / 2 + 0.01, 0, 0.35); scene.add(ph);
    return { scene, camera: cameraFor(w, h, [0.4, 6.2, 6.2], [0.3, -0.9, 0.4], 34), vignette: 0.14, vcolor: "30,50,60", env: 0.85 };
  },
  "story-3": (w, h) => {
    const scene = new THREE.Scene();
    scene.background = gradientBg("#F1E6DD", "#E6D3C4");
    warmGround(scene, 0xD9C2B0);
    addLights(scene, { key: [-3, 7, 4], keyI: 2.5, rim: [4, 3, -3], rimI: 30, rimColor: 0xffd0b0, fill: 0.75 });
    const cu = slab(3.4, 0.9, 2.4, 0xF7D2C4, 0.95); cu.position.set(-0.4, -1.0, -0.2); cu.rotation.y = -0.2; scene.add(cu);
    const cu2 = slab(2.6, 0.8, 2.0, 0x06264B, 0.95); cu2.position.set(-0.2, -0.3, -0.4); cu2.rotation.set(0.05, -0.45, 0.05); scene.add(cu2);
    const hp = headphones(); hp.position.set(0.4, 0.28, 0.8); hp.rotation.set(-Math.PI / 2 + 0.5, 0, 0.3); hp.scale.setScalar(0.85); scene.add(hp);
    const mg = mug(); mg.position.set(3.3, -1.1, 1.0); scene.add(mg);
    return { scene, camera: cameraFor(w, h, [0.2, 5.8, 6.4], [0.1, -0.7, 0.2], 34), vignette: 0.16, vcolor: "70,40,20", env: 0.85 };
  },
};

/* ------------------------------------------------------------ render */

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;

window.renderScene = (name, w, h) => {
  seed = 11;
  const { scene, camera, vignette, vcolor, env: envI } = SCENES[name](w, h);
  scene.environment = env;
  scene.environmentIntensity = envI;
  renderer.setSize(Math.round(w * SS), Math.round(h * SS));
  renderer.render(scene, camera);

  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const g = out.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(renderer.domElement, 0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, "rgba(" + vcolor + ",0)"); v.addColorStop(1, "rgba(" + vcolor + "," + vignette + ")");
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  if (vignette > 0) for (let i = 0; i < d.length; i += 4) { const n = (rand() - 0.5) * 8; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  scene.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  return out.toDataURL("image/jpeg", 0.88);
};

window.ready = true;
</script></body></html>`;

async function main() {
  const { chromium } = await import("playwright");
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tempo-art-"));
  const pagePath = path.join(tmp, "render.html");
  fs.writeFileSync(pagePath, PAGE, "utf8");
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("page error:", e.message));
    page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
    await page.goto(pathToFileURL(pagePath).href, { waitUntil: "load" });
    await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      if (only.length && !only.includes(name)) continue;
      const t0 = Date.now();
      const dataUrl = await page.evaluate(([n, a, b]) => window.renderScene(n, a, b), [name, w, h]);
      const file = path.join(OUT_DIR, `${name}.jpg`);
      fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
      console.log(`tempo-assets/${name}.jpg ${w}x${h} ${Math.round(fs.statSync(file).size / 1024)} KB (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
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

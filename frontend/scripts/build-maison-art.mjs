#!/usr/bin/env node
/**
 * Demo art for the Maison store template card and preview: one fragrance bottle in eight
 * quiet-luxury scenes, modelled and lit in three.js (physically based glass, brushed brass,
 * window light) and rendered locally in headless Chromium — no image API, no photos.
 *
 * Usage (from frontend/):
 *   node scripts/build-maison-art.mjs            (all scenes)
 *   node scripts/build-maison-art.mjs hero craft (some scenes)
 *
 * Writes public/maison-assets/*.jpg. three.js is loaded from jsDelivr (pinned) by the
 * render page only; the app itself never loads it. The demo copy in
 * app/routes/_app.generate_store/store/utils/buildMaisonDemo.js points at these files; rebuild
 * the card screenshots afterwards with `npx vite-node scripts/build-maison-previews.mjs`.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "maison-assets");

/** name → [width, height]; names are the files buildMaisonDemo.js references. */
const SIZES = {
  hero: [2000, 1125],
  inline: [600, 600],
  piece: [1200, 1500],
  "gallery-1": [1200, 1500],
  "gallery-2": [1200, 1500],
  "gallery-3": [1200, 1500],
  craft: [1200, 1200],
  banner: [2000, 1125],
};

const PAGE = String.raw`<!doctype html>
<html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@600&family=Instrument+Serif&display=block">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/"}}</script>
</head><body style="margin:0">
<script type="module">
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const SS = 1.5; // supersampling
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/* ------------------------------------------------------------ textures */

function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8;
  return t;
}

function speckle(g, w, h, n, colors, alpha, rMax = 1.4) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rand() * colors.length)];
    g.globalAlpha = alpha * (0.4 + rand() * 0.6);
    g.beginPath();
    g.arc(rand() * w, rand() * h, 0.3 + rand() * rMax, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

const plaster = (base) => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h, r = 80 + rand() * 260;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = rand() > 0.5 ? "255,250,240" : "120,100,80";
    grd.addColorStop(0, "rgba(" + tone + ",0.05)"); grd.addColorStop(1, "rgba(" + tone + ",0)");
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(g, w, h, 26000, ["#ffffff", "#8a7a66"], 0.08, 1.1);
}, { repeat: [3, 2] });

const travertine = (base = "#DFD3BE") => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const y = rand() * h, th = 2 + rand() * 18;
    g.fillStyle = rand() > 0.5 ? "rgba(255,248,235,0.07)" : "rgba(150,125,95,0.045)";
    g.fillRect(0, y, w, th);
  }
  for (let i = 0; i < 1400; i++) {
    const x = rand() * w, y = rand() * h;
    g.fillStyle = "rgba(120,95,65," + (0.12 + rand() * 0.25) + ")";
    g.beginPath(); g.ellipse(x, y, 1 + rand() * 9, 0.6 + rand() * 2.4, 0, 0, Math.PI * 2); g.fill();
  }
  speckle(g, w, h, 18000, ["#fffaf0", "#a08d72"], 0.1, 1);
});

const marble = () => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = "#F2EFEA"; g.fillRect(0, 0, w, h);
  g.filter = "blur(1.2px)";
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = "rgba(120,115,108," + (0.08 + rand() * 0.22) + ")";
    g.lineWidth = 0.6 + rand() * 2.6;
    g.beginPath();
    let x = rand() * w, y = -20;
    g.moveTo(x, y);
    while (y < h + 20) { x += (rand() - 0.5) * 90; y += 30 + rand() * 60; g.lineTo(x, y); }
    g.stroke();
  }
  g.filter = "none";
  speckle(g, w, h, 9000, ["#ffffff", "#b8b2a8"], 0.08, 1);
});

const linen = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#E8DECD"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) { g.fillStyle = "rgba(255,250,240," + (0.05 + rand() * 0.08) + ")"; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 2) { g.fillStyle = "rgba(120,100,80," + (0.03 + rand() * 0.05) + ")"; g.fillRect(x, 0, 1, h); }
}, { repeat: [6, 6] });

const brushed = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x++) { g.fillStyle = "rgba(" + (rand() > 0.5 ? "255,255,255" : "0,0,0") + "," + rand() * 0.18 + ")"; g.fillRect(x, 0, 1, h); }
}, { srgb: false });

const label = () => canvasTex(1000, 620, (g, w, h) => {
  g.fillStyle = "#F4EDE0"; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 4000, ["#ffffff", "#c8b89a"], 0.12, 1);
  g.strokeStyle = "#A8864F"; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
  g.lineWidth = 1.2; g.strokeRect(48, 48, w - 96, h - 96);
  g.fillStyle = "#1D1915"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.font = '400 210px "Instrument Serif"'; g.letterSpacing = "26px";
  g.fillText("AMBRE", w / 2 + 13, 350);
  g.fillStyle = "#7A5F36"; g.font = '600 34px "Instrument Sans"'; g.letterSpacing = "11px";
  g.fillText("LUMIÈRE · EAU DE PARFUM", w / 2 + 5, 450);
  g.font = '600 26px "Instrument Sans"'; g.letterSpacing = "8px";
  g.fillText("50 ML", w / 2 + 4, 520);
});

/** Window-pane gobo for the key spotlight (white passes light, black blocks it). */
const windowGobo = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.filter = "blur(7px)";
  g.fillStyle = "#fff";
  const pad = 70, gap = 18, cw = (w - pad * 2 - gap) / 2, ch = (h - pad * 2 - gap * 2) / 3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) g.fillRect(pad + c * (cw + gap), pad + r * (ch + gap), cw, ch);
  g.filter = "none";
});

/* ------------------------------------------------------------ materials */

const M = {
  glass: () => new THREE.MeshPhysicalMaterial({ color: "#fffaf2", roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.9, ior: 1.5, attenuationColor: new THREE.Color("#D99A45"), attenuationDistance: 1.15, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.4 }),
  clearGlass: () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.03, transmission: 1, thickness: 0.3, ior: 1.5, attenuationColor: new THREE.Color("#EFE4CC"), attenuationDistance: 2.5, envMapIntensity: 1.4 }),
  brass: () => new THREE.MeshPhysicalMaterial({ color: "#E2C083", metalness: 1, roughness: 0.24, roughnessMap: brushed(), anisotropy: 0.85, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.8 }),
  matte: (color, roughness = 0.92, map = null) => new THREE.MeshStandardMaterial({ color, roughness, map }),
  satin: (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color("#FFF2DA"), side: THREE.DoubleSide }),
};

/* ------------------------------------------------------------ objects */

function shadowed(o, cast = true, receive = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } });
  return o;
}

/** Fragrance bottle, base centred at the origin, ~1.75 tall. */
function bottle({ capOff = false } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.16, 0.58, 6, 0.07), M.clearGlass());
  base.position.y = 0.08;
  base.castShadow = false;
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.02, 0.58, 8, 0.1), M.glass());
  body.position.y = 0.16 + 0.51;
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.347), M.matte("#ffffff", 0.85, label()));
  lab.position.set(0, 0.66, 0.291);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 48), M.brass());
  neck.position.y = 1.24;
  g.add(base, body, lab, neck);
  if (!capOff) g.add(cap(1.3));
  shadowed(g);
  body.castShadow = false; // glass throws light, not a solid shadow
  return g;
}

function cap(y = 0) {
  const c = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.44, 0.48, 5, 0.03), M.brass());
  c.position.y = y + 0.22;
  return shadowed(c);
}

function box(w, h, d, mat, x = 0, y = 0, z = 0, r = 0.01) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y + h / 2, z);
  return shadowed(m);
}

function stem(x, z, h, lean, tilt = 0) {
  const g = new THREE.Group();
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.2, h * 0.6, 0), new THREE.Vector3(lean, h, 0));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.007, 6), M.matte("#A88E62", 0.8)));
  const seedMat = M.matte("#CDB78E", 0.75);
  for (let i = 0; i < 9; i++) {
    const t = 0.55 + i * 0.05;
    const p = curve.getPoint(t);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), seedMat);
    s.scale.set(0.55, 1.4, 0.55);
    s.position.set(p.x + (i % 2 ? 0.02 : -0.02), p.y, p.z);
    s.rotation.z = i % 2 ? -0.5 : 0.5;
    g.add(s);
  }
  g.position.set(x, 0, z);
  g.rotation.y = tilt;
  return shadowed(g);
}

/** Flat satin ribbon swept along a curve. */
function ribbon(points, width, color) {
  const curve = new THREE.CatmullRomCurve3(points);
  const n = 160, pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n), t = curve.getTangent(i / n);
    const side = new THREE.Vector3(0, 1, 0).cross(t).normalize().multiplyScalar(width / 2);
    const twist = Math.sin(i / n * Math.PI * 2) * 0.35;
    side.applyAxisAngle(t, twist);
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  return shadowed(new THREE.Mesh(geo, M.satin(color)));
}

function vase() {
  const pts = [[0, 0], [0.2, 0], [0.26, 0.08], [0.28, 0.3], [0.22, 0.52], [0.12, 0.66], [0.11, 0.78], [0.13, 0.8]].map(([x, y]) => new THREE.Vector2(x, y));
  const v = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ color: "#EDE7DC", roughness: 0.55, side: THREE.DoubleSide }));
  return shadowed(v);
}

/* ------------------------------------------------------------ stage */

function stage({ wall = "#E7DDCC", floor = "#DCD0BB", floorMap = null, floorY = 0, wallZ = -2.4, dark = false }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(wall);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), M.matte(wall, 0.96, plaster(wall)));
  w.position.set(0, 6, wallZ); w.receiveShadow = true;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), M.matte(floor, floorMap ? 0.6 : 0.9, floorMap));
  f.rotation.x = -Math.PI / 2; f.position.y = floorY; f.receiveShadow = true;
  scene.add(w, f);
  scene.add(new THREE.HemisphereLight(dark ? "#5a4a3a" : "#fff6ea", dark ? "#1a1410" : "#b9a88e", dark ? 0.25 : 0.7));
  return scene;
}

function windowLight(scene, { pos = [-5, 5.5, 3.5], target = [0.6, 1, -2.4], intensity = 260, color = "#FFF1DC", angle = 0.42, gobo = true } = {}) {
  const s = new THREE.SpotLight(color, intensity, 0, angle, 0.55, 2);
  s.position.set(...pos);
  s.target.position.set(...target);
  s.castShadow = true;
  s.shadow.mapSize.set(2048, 2048);
  s.shadow.radius = 10; s.shadow.blurSamples = 20;
  s.shadow.bias = -0.0004;
  s.shadow.intensity = 0.82;
  if (gobo) s.map = windowGobo();
  scene.add(s, s.target);
  const fill = new THREE.DirectionalLight("#fff8ee", 0.35);
  fill.position.set(4, 3, 5);
  scene.add(fill);
  return s;
}

/** Warm light pooled on the wall behind a bottle, so dark-scene glass glows amber. */
function wallWash(scene, x, wallZ, intensity = 140) {
  const s = new THREE.SpotLight("#FFB866", intensity, 0, 0.5, 1, 2);
  s.position.set(x, 3.2, wallZ + 1.1);
  s.target.position.set(x, 1.0, wallZ);
  scene.add(s, s.target);
}

function cameraFor(w, h, pos, look, fov) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.05, 80);
  c.position.set(...pos); c.lookAt(...look);
  return c;
}

/* ------------------------------------------------------------ scenes */

const SCENES = {
  hero(w, h) {
    const scene = stage({ wall: "#E9DFCE", floor: "#DED2BE" });
    windowLight(scene, { target: [-0.6, 1.4, -2.4], intensity: 300 });
    scene.add(box(1.7, 0.62, 1.15, M.matte("#E2D5BF", 0.85, travertine()), 1.15, 0, 0));
    const b = bottle(); b.position.set(1.12, 0.62, 0.05); b.rotation.y = -0.32; scene.add(b);
    scene.add(stem(1.72, -0.1, 1.15, 0.28, 0.2), stem(1.8, 0.05, 0.95, 0.42, -0.4));
    return { scene, camera: cameraFor(w, h, [-0.4, 1.6, 8.4], [0.5, 1.3, 0], 22), vignette: 0.16 };
  },
  inline(w, h) {
    const scene = stage({ wall: "#E2D4BD", floor: "#D9CBB2" });
    windowLight(scene, { pos: [-3, 4, 3], target: [0, 1.2, 0], intensity: 220, gobo: false });
    const b = bottle(); b.rotation.y = -0.6; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0.35, 1.5, 1.25], [0.05, 1.32, 0], 26), vignette: 0.1 };
  },
  piece(w, h) {
    const scene = stage({ wall: "#EAE2D5", floor: "#E4DACA" });
    windowLight(scene, { pos: [-4, 6, 4], target: [0.3, 0.6, 0], intensity: 260, gobo: false, angle: 0.5 });
    const b = bottle(); b.rotation.y = -0.42; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0, 1.15, 7.4], [0, 0.92, 0], 22), vignette: 0.14 };
  },
  "gallery-1"(w, h) {
    const scene = stage({ wall: "#E6DCCB", floor: "#E3D8C5", floorMap: linen() });
    windowLight(scene, { pos: [-4.5, 6, 2], target: [0.4, 0, -0.4], intensity: 280 });
    const b = bottle({ capOff: true }); b.position.set(-0.25, 0, -0.1); b.rotation.y = 0.35; scene.add(b);
    const c = cap(); c.position.set(0.85, 0, 0.45); c.rotation.y = 0.5; scene.add(c);
    scene.add(ribbon([new THREE.Vector3(-1.6, 0.01, 1.1), new THREE.Vector3(-0.4, 0.03, 0.75), new THREE.Vector3(0.5, 0.02, 1.15), new THREE.Vector3(1.6, 0.04, 0.8)], 0.16, "#E9DABA"));
    return { scene, camera: cameraFor(w, h, [0.35, 2.1, 6.2], [0.2, 0.7, 0.1], 25), vignette: 0.15 };
  },
  "gallery-2"(w, h) {
    const scene = stage({ wall: "#E8E0D2", floor: "#D9CEBC" });
    windowLight(scene, { pos: [-5, 5, 2.5], target: [0.4, 1, -2.4], intensity: 280 });
    scene.add(box(3.2, 0.14, 1.9, M.matte("#F2EFEA", 0.35, marble()), 0.2, 0, 0, 0.02));
    const gift = box(1.3, 0.95, 0.9, M.matte("#EFE7DA", 0.9), 0.85, 0.14, -0.35, 0.015);
    gift.rotation.y = -0.25; scene.add(gift);
    const bandMat = M.satin("#C9A86E");
    const b1 = box(0.16, 0.97, 0.92, bandMat, 0.85, 0.135, -0.35, 0.005); b1.rotation.y = -0.25; scene.add(b1);
    const b2 = box(1.32, 0.97, 0.14, bandMat, 0.85, 0.135, -0.35, 0.005); b2.rotation.y = -0.25; scene.add(b2);
    const b = bottle(); b.position.set(-0.45, 0.14, 0.35); b.rotation.y = 0.28; scene.add(b);
    return { scene, camera: cameraFor(w, h, [-0.4, 1.4, 7.4], [0.2, 0.95, 0], 24), vignette: 0.15 };
  },
  "gallery-3"(w, h) {
    const scene = stage({ wall: "#E5DAC8", floor: "#CDB38C", wallZ: -0.9 });
    windowLight(scene, { pos: [-4, 5, 4], target: [0.2, 1.4, -0.9], intensity: 300 });
    const arch = new THREE.Shape();
    arch.moveTo(-0.8, 0); arch.lineTo(-0.8, 1.7); arch.absarc(0, 1.7, 0.8, Math.PI, 0, true); arch.lineTo(0.8, 0); arch.lineTo(-0.8, 0);
    const mirror = new THREE.Mesh(new THREE.ShapeGeometry(arch, 48), new THREE.MeshStandardMaterial({ color: "#F1ECE3", metalness: 0.9, roughness: 0.12, envMapIntensity: 0.8 }));
    mirror.position.set(-0.1, 0.02, -0.86);
    const fp = arch.getPoints(80).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fp, true), 200, 0.025, 10, true), M.brass());
    frame.position.copy(mirror.position);
    scene.add(mirror, shadowed(frame));
    const v = vase(); v.position.set(-0.75, 0, -0.35); scene.add(v);
    scene.add(stem(-0.75, -0.35, 1.25, -0.2, 0), stem(-0.72, -0.33, 1.45, 0.15, 0.6), stem(-0.78, -0.37, 1.05, 0.38, -0.5));
    const b = bottle(); b.position.set(0.55, 0, 0); b.rotation.y = -0.3; b.scale.setScalar(0.85); scene.add(b);
    return { scene, camera: cameraFor(w, h, [0, 1.25, 5.6], [-0.05, 1.05, -0.3], 25), vignette: 0.15 };
  },
  craft(w, h) {
    const scene = stage({ wall: "#2B241E", floor: "#352C24", dark: true });
    windowLight(scene, { pos: [-3, 4.5, 3], target: [0, 1.2, 0], intensity: 160, color: "#FFE2B8", gobo: false, angle: 0.36 });
    const rim = new THREE.SpotLight("#FFD9A0", 90, 0, 0.4, 0.6, 2); rim.position.set(3, 3, -2.5); rim.target.position.set(0, 1.2, 0); scene.add(rim, rim.target);
    wallWash(scene, 0, -2.4, 160);
    const b = bottle(); b.rotation.y = -0.5; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0.25, 1.6, 2.2], [0, 1.28, 0], 30), vignette: 0.3 };
  },
  banner(w, h) {
    const scene = stage({ wall: "#2E2620", floor: "#3B3129", dark: true });
    windowLight(scene, { pos: [-2, 4, 3], target: [1.3, 1, -2.4], intensity: 140, color: "#FFDDB0", angle: 0.55 });
    scene.add(box(8, 0.5, 1.6, M.matte("#4A3D31", 0.7, travertine("#5A4A3B")), 0.5, 0, 0));
    wallWash(scene, 1.55, -2.4, 170);
    const b = bottle(); b.position.set(1.55, 0.5, 0.15); b.rotation.y = -0.35; scene.add(b);
    return { scene, camera: cameraFor(w, h, [0, 1.35, 7], [0.4, 1.0, 0], 22), vignette: 0.28 };
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
  seed = 7;
  const { scene, camera, vignette } = SCENES[name](w, h);
  scene.environment = env;
  scene.environmentIntensity = name === "craft" || name === "banner" ? 0.35 : 0.8;
  renderer.setSize(Math.round(w * SS), Math.round(h * SS));
  renderer.render(scene, camera);

  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const g = out.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(renderer.domElement, 0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, "rgba(20,14,8,0)"); v.addColorStop(1, "rgba(20,14,8," + vignette + ")");
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  scene.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  return out.toDataURL("image/jpeg", 0.88);
};

await document.fonts.load('400 200px "Instrument Serif"');
await document.fonts.load('600 30px "Instrument Sans"');
window.ready = true;
</script></body></html>`;

async function main() {
  const { chromium } = await import("playwright");
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "maison-art-"));
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
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      if (only.length && !only.includes(name)) continue;
      const t0 = Date.now();
      const dataUrl = await page.evaluate(([n, a, b]) => window.renderScene(n, a, b), [name, w, h]);
      const file = path.join(OUT_DIR, `${name}.jpg`);
      fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
      console.log(`maison-assets/${name}.jpg ${w}x${h} ${Math.round(fs.statSync(file).size / 1024)} KB (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
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

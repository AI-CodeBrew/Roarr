#!/usr/bin/env node
/**
 * Demo product photos for the Aura (serum), Noir (watch) and Frost (bottle) template cards, drawn as SVG and
 * rasterized locally — no image API, no third-party photos.
 *
 * Usage (from frontend/):
 *   node scripts/build-demo-art.mjs            (all sets)
 *   node scripts/build-demo-art.mjs frost      (one set: aura, noir or frost)
 *
 * Writes public/{aura,noir,frost}-assets/*.jpg. The demo copy in
 * default-magic-responses/{health-beauty,noir,frost}.js points at these files; rebuild the card
 * screenshots afterwards with `npx vite-node scripts/build-product-previews.mjs`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "..", "public");

/** Deterministic noise so rebuilds produce the same pictures. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const svg = (w, h, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

/* ---------------------------------------------------------------- shared defs */

const SHARED_DEFS = `
  <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
  </filter>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F3E2B8"/><stop offset=".45" stop-color="#D4B57A"/>
    <stop offset=".75" stop-color="#A9844A"/><stop offset="1" stop-color="#E6CE96"/>
  </linearGradient>
  <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#A9844A"/><stop offset=".5" stop-color="#F1DEB0"/><stop offset="1" stop-color="#B8935A"/>
  </linearGradient>`;

const grainOverlay = (w, h, opacity = 1) =>
  `<rect width="${w}" height="${h}" filter="url(#grain)" opacity="${opacity}"/>`;

/* ---------------------------------------------------------------- watch (Noir) */

const WATCH_DEFS = `
  <linearGradient id="wCase" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4C4741"/><stop offset=".42" stop-color="#1C1A18"/>
    <stop offset=".7" stop-color="#0E0D0C"/><stop offset="1" stop-color="#3A352F"/>
  </linearGradient>
  <linearGradient id="wBezel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2E2B27"/><stop offset="1" stop-color="#0A0908"/>
  </linearGradient>
  <radialGradient id="wDial" cx=".42" cy=".38" r=".75">
    <stop offset="0" stop-color="#262320"/><stop offset=".6" stop-color="#121110"/><stop offset="1" stop-color="#070606"/>
  </radialGradient>
  <linearGradient id="wStrap" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#120F0D"/><stop offset=".5" stop-color="#26201B"/><stop offset="1" stop-color="#110E0C"/>
  </linearGradient>
  <linearGradient id="wEdge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset=".8" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#E4D2AA" stop-opacity=".35"/>
  </linearGradient>
  <linearGradient id="wGlass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".16"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="wDialClip"><circle cx="500" cy="500" r="197"/></clipPath>`;

/** A 10:10 automatic, face up, strap running top to bottom. Local box 1000×1000 centred on 500,500. */
function watch() {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    ticks.push(`<line x1="500" y1="310" x2="500" y2="318" stroke="#71675A" stroke-width="2" transform="rotate(${i * 6} 500 500)"/>`);
  }
  const indices = [];
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue; // date window
    if (i === 0) {
      indices.push(`<rect x="485" y="322" width="9" height="38" rx="1.5" fill="url(#goldH)"/><rect x="506" y="322" width="9" height="38" rx="1.5" fill="url(#goldH)"/>`);
      continue;
    }
    indices.push(`<rect x="495.5" y="324" width="9" height="32" rx="1.5" fill="url(#goldH)" transform="rotate(${i * 30} 500 500)"/>`);
  }
  const knurl = [];
  for (let x = 738; x <= 758; x += 4) knurl.push(`<line x1="${x}" y1="478" x2="${x}" y2="522" stroke="#000" stroke-opacity=".45" stroke-width="1.5"/>`);
  const stitches = (x1, y1, x2, y2) =>
    `<path d="M${x1},${y1} L${x2},${y2}" stroke="#8C7550" stroke-width="3" stroke-dasharray="11 8" stroke-linecap="round" opacity=".85"/>`;
  const hand = (d, angle) => `
    <g transform="rotate(${angle} 500 500)">
      <path d="${d}" fill="#000" opacity=".5" transform="translate(5 7)" filter="url(#blur8)"/>
      <path d="${d}" fill="url(#goldH)"/>
    </g>`;
  return `
  <g>
    <!-- straps -->
    <path d="M434,-90 L566,-90 L590,312 L410,312 Z" fill="url(#wStrap)"/>
    ${stitches(448, -90, 426, 300)}${stitches(552, -90, 574, 300)}
    <path d="M410,688 L590,688 L566,1090 L434,1090 Z" fill="url(#wStrap)"/>
    ${stitches(426, 700, 448, 1090)}${stitches(574, 700, 552, 1090)}
    <rect x="420" y="852" width="160" height="28" rx="4" fill="#1F1A16" stroke="#2F2822" stroke-width="2"/>
    <rect x="428" y="996" width="144" height="50" rx="10" fill="none" stroke="url(#gold)" stroke-width="9"/>
    <rect x="496" y="990" width="8" height="40" rx="3" fill="url(#gold)"/>
    <!-- lugs -->
    <path d="M404,292 L462,292 L474,352 L392,344 Z" fill="url(#wCase)"/>
    <path d="M538,292 L596,292 L608,344 L526,352 Z" fill="url(#wCase)"/>
    <path d="M392,656 L474,648 L462,708 L404,708 Z" fill="url(#wCase)"/>
    <path d="M526,648 L608,656 L596,708 L538,708 Z" fill="url(#wCase)"/>
    <!-- crown -->
    <rect x="728" y="488" width="10" height="24" fill="#24211E"/>
    <rect x="732" y="472" width="32" height="56" rx="6" fill="url(#wCase)"/>
    ${knurl.join("")}
    <!-- case -->
    <circle cx="500" cy="500" r="236" fill="url(#wCase)" stroke="#000" stroke-opacity=".6" stroke-width="2"/>
    <circle cx="500" cy="500" r="233" fill="none" stroke="url(#wEdge)" stroke-width="4"/>
    <circle cx="500" cy="500" r="214" fill="url(#wBezel)"/>
    <circle cx="500" cy="500" r="202" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
    <circle cx="500" cy="500" r="197" fill="url(#wDial)"/>
    ${ticks.join("")}
    ${indices.join("")}
    <rect x="616" y="485" width="44" height="30" rx="2" fill="#EEE7DA" stroke="url(#gold)" stroke-width="2"/>
    <text x="638" y="507" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#141210">28</text>
    <text x="500" y="610" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" letter-spacing="5" fill="#C9A96E">AUTOMATIC</text>
    <!-- hands at 10:10:37 -->
    ${hand("M500,362 L512,500 L500,516 L488,500 Z", 305)}
    ${hand("M500,318 L510,500 L500,516 L490,500 Z", 60)}
    <g transform="rotate(222 500 500)">
      <line x1="500" y1="552" x2="500" y2="322" stroke="#E4D2AA" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="495" y="540" width="10" height="22" rx="3" fill="#E4D2AA"/>
    </g>
    <circle cx="500" cy="500" r="12" fill="url(#gold)"/><circle cx="500" cy="500" r="4" fill="#111"/>
    <!-- crystal -->
    <ellipse cx="420" cy="400" rx="185" ry="95" transform="rotate(-35 420 400)" fill="url(#wGlass)" clip-path="url(#wDialClip)"/>
  </g>`;
}

const watchShadow = (dx = 16, dy = 26, opacity = 0.75) => `
  <g transform="translate(${dx} ${dy})" opacity="${opacity}" filter="url(#blur20)">
    <circle cx="500" cy="500" r="236" fill="#000"/>
    <path d="M434,-90 L566,-90 L590,312 L410,312 Z M410,688 L590,688 L566,1090 L434,1090 Z" fill="#000"/>
  </g>`;

const place = (inner, { x, y, s = 1, sy = s, r = 0, ox = 500, oy = 500 }) =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s} ${sy}) translate(${-ox} ${-oy})">${inner}</g>`;

const studio = (w, h, cx = 0.5, cy = 0.42, c0 = "#2D271F") => `
  <radialGradient id="studio" cx="${cx}" cy="${cy}" r=".75">
    <stop offset="0" stop-color="${c0}"/><stop offset=".5" stop-color="#15120F"/><stop offset="1" stop-color="#080706"/>
  </radialGradient>`;

function woodDesk(w, h, seed = 3) {
  const rand = rng(seed);
  const lines = [];
  for (let i = 0; i < 70; i++) {
    const y = rand() * h;
    const amp = 6 + rand() * 18;
    const op = 0.05 + rand() * 0.12;
    lines.push(`<path d="M-20,${y} C${w * 0.3},${y + amp} ${w * 0.6},${y - amp} ${w + 20},${y + amp * 0.5}" stroke="${rand() > 0.5 ? "#000" : "#5A3E2A"}" stroke-opacity="${op}" stroke-width="${1 + rand() * 3}" fill="none"/>`);
  }
  return `<rect width="${w}" height="${h}" fill="url(#wood)"/>${lines.join("")}`;
}

const NOIR = {
  product_image_1: [1200, 1200, () => {
    const defs = studio(1200, 1200);
    const body = `<rect width="1200" height="1200" fill="url(#studio)"/>
      ${place(watchShadow() + watch(), { x: 600, y: 600, s: 1.05, r: -14 })}`;
    return [defs, body];
  }],
  product_image_2: [1200, 1200, () => {
    const defs = studio(1200, 1200, 0.32, 0.3, "#342B21");
    const body = `<rect width="1200" height="1200" fill="url(#studio)"/>
      ${place(watchShadow(30, 30) + watch(), { x: 620, y: 640, s: 1.12, sy: 0.74, r: 30 })}`;
    return [defs, body];
  }],
  product_image_3: [1200, 1200, () => {
    const defs = studio(1200, 1200, 0.6, 0.4, "#221E19");
    const body = `<rect width="1200" height="1200" fill="url(#studio)"/>
      ${place(watch(), { x: 600, y: 600, s: 3.1, ox: 560, oy: 440 })}`;
    return [defs, body];
  }],
  product_image_4: [1200, 1200, () => {
    const defs = `<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A1D15"/><stop offset="1" stop-color="#120C08"/></linearGradient>
      <radialGradient id="warm" cx=".78" cy=".2" r=".8"><stop offset="0" stop-color="#E0B46A" stop-opacity=".28"/><stop offset="1" stop-color="#E0B46A" stop-opacity="0"/></radialGradient>
      <linearGradient id="book" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E2219"/><stop offset="1" stop-color="#17110D"/></linearGradient>
      <linearGradient id="pen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3633"/><stop offset=".5" stop-color="#0C0B0A"/><stop offset="1" stop-color="#22201E"/></linearGradient>`;
    const body = `${woodDesk(1200, 1200)}
      <g transform="rotate(-9 380 640)">
        <rect x="120" y="420" width="520" height="680" rx="14" fill="#000" opacity=".55" filter="url(#blur20)" transform="translate(14 20)"/>
        <rect x="120" y="420" width="520" height="680" rx="14" fill="url(#book)"/>
        <rect x="140" y="420" width="6" height="680" fill="#3B2D22"/>
        <line x1="600" y1="420" x2="600" y2="1100" stroke="#C9A96E" stroke-width="3" opacity=".7"/>
      </g>
      <g transform="rotate(38 700 900)">
        <rect x="380" y="896" width="640" height="34" rx="17" fill="#000" opacity=".5" filter="url(#blur8)" transform="translate(8 14)"/>
        <rect x="380" y="896" width="640" height="34" rx="17" fill="url(#pen)"/>
        <rect x="640" y="894" width="26" height="38" fill="url(#gold)"/>
        <path d="M380,913 L330,906 L330,920 Z" fill="url(#gold)"/>
        <rect x="860" y="888" width="120" height="8" rx="4" fill="url(#gold)"/>
      </g>
      ${place(watchShadow(20, 30, 0.8) + watch(), { x: 790, y: 470, s: 0.62, r: 24 })}
      <rect width="1200" height="1200" fill="url(#warm)"/>
      ${grainOverlay(1200, 1200, 0.6)}`;
    return [defs, body];
  }],
  product_image_5: [1200, 1200, () => {
    const defs = `<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#C9A96E" stop-opacity=".42"/><stop offset=".6" stop-color="#C9A96E" stop-opacity=".08"/><stop offset="1" stop-color="#C9A96E" stop-opacity="0"/></radialGradient>`;
    const body = `<rect width="1200" height="1200" fill="#070606"/>
      <circle cx="600" cy="600" r="560" fill="url(#glow)"/>
      ${place(watchShadow(10, 18, 0.9) + watch(), { x: 600, y: 600, s: 0.95 })}`;
    return [defs, body];
  }],
  product_highlight_1: [900, 1200, () => {
    const defs = studio(900, 1200, 0.3, 0.45, "#2A241D");
    const body = `<rect width="900" height="1200" fill="url(#studio)"/>
      ${place(watch(), { x: 470, y: 600, s: 2.7, ox: 712, oy: 500 })}`;
    return [defs, body];
  }],
  product_highlight_2: [900, 1200, () => {
    const defs = studio(900, 1200, 0.5, 0.3, "#2A241D");
    const body = `<rect width="900" height="1200" fill="url(#studio)"/>
      ${place(watchShadow(10, 16, 0.7) + watch(), { x: 450, y: 560, s: 1.75, r: -6, ox: 500, oy: 820 })}`;
    return [defs, body];
  }],
  product_highlight_3: [900, 1200, () => {
    const defs = `<linearGradient id="lac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1815"/><stop offset="1" stop-color="#0A0908"/></linearGradient>
      <linearGradient id="satin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A322A"/><stop offset=".5" stop-color="#1C1814"/><stop offset="1" stop-color="#2E2721"/></linearGradient>
      <radialGradient id="spot" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#2B251E"/><stop offset="1" stop-color="#070606"/></radialGradient>
      <clipPath id="cushion"><rect x="150" y="610" width="600" height="330" rx="24"/></clipPath>`;
    const body = `<rect width="900" height="1200" fill="url(#spot)"/>
      <rect x="100" y="1000" width="700" height="60" rx="30" fill="#000" opacity=".7" filter="url(#blur20)"/>
      <path d="M110,170 L790,170 L770,560 L130,560 Z" fill="url(#lac)" stroke="#C9A96E" stroke-opacity=".5" stroke-width="2"/>
      <path d="M150,205 L750,205 L734,530 L166,530 Z" fill="url(#satin)"/>
      <rect x="110" y="560" width="680" height="440" rx="10" fill="url(#lac)" stroke="#C9A96E" stroke-opacity=".5" stroke-width="2"/>
      <rect x="150" y="610" width="600" height="330" rx="24" fill="url(#satin)"/>
      <g clip-path="url(#cushion)">${place(watchShadow(8, 14, 0.8) + watch(), { x: 450, y: 775, s: 0.6, r: 90 })}</g>
      <line x1="110" y1="560" x2="790" y2="560" stroke="#C9A96E" stroke-width="3" opacity=".8"/>`;
    return [defs, body];
  }],
  feature_image: [1920, 1080, () => {
    const defs = `<radialGradient id="spotR" cx=".7" cy=".42" r=".55"><stop offset="0" stop-color="#3B3024"/><stop offset=".55" stop-color="#15110E"/><stop offset="1" stop-color="#060505"/></radialGradient>
      <linearGradient id="leftShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#040404"/><stop offset=".5" stop-color="#040404" stop-opacity=".7"/><stop offset=".75" stop-color="#040404" stop-opacity="0"/></linearGradient>`;
    const body = `<rect width="1920" height="1080" fill="url(#spotR)"/>
      ${place(watchShadow(24, 34, 0.85) + watch(), { x: 1380, y: 560, s: 0.82, r: -18 })}
      <rect width="1920" height="1080" fill="url(#leftShade)"/>
      ${grainOverlay(1920, 1080, 0.5)}`;
    return [defs, body];
  }],
  product_impact_image: [1000, 1250, () => {
    const rand = rng(11);
    const bokeh = [];
    for (let i = 0; i < 14; i++) {
      bokeh.push(`<circle cx="${rand() * 1000}" cy="${rand() * 520}" r="${18 + rand() * 46}" fill="#E0B46A" opacity="${0.06 + rand() * 0.14}" filter="url(#blur8)"/>`);
    }
    const defs = `<radialGradient id="eve" cx=".3" cy=".15" r=".9"><stop offset="0" stop-color="#4A3720"/><stop offset=".45" stop-color="#17120D"/><stop offset="1" stop-color="#070605"/></radialGradient>
      <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E0D0C"/><stop offset=".35" stop-color="#2A2622"/><stop offset="1" stop-color="#0B0A09"/></linearGradient>`;
    const body = `<rect width="1000" height="1250" fill="url(#eve)"/>
      ${bokeh.join("")}
      <rect x="150" y="840" width="700" height="410" fill="url(#stone)"/>
      <ellipse cx="500" cy="840" rx="350" ry="80" fill="#1F1C19" stroke="#C9A96E" stroke-opacity=".55" stroke-width="2"/>
      ${place(watchShadow(10, 10, 0.8) + watch(), { x: 500, y: 735, s: 0.7, sy: 0.46, r: 0 })}
      ${grainOverlay(1000, 1250, 0.5)}`;
    return [defs, body];
  }],
};

/* ---------------------------------------------------------------- serum (Aura) */

const SERUM_DEFS = `
  <linearGradient id="sGlass" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".18" stop-color="#FFFFFF" stop-opacity=".12"/>
    <stop offset=".65" stop-color="#FFFFFF" stop-opacity=".04"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".32"/>
  </linearGradient>
  <linearGradient id="sLiquid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#EDC6B6"/><stop offset="1" stop-color="#C4826F"/>
  </linearGradient>
  <linearGradient id="sLiquidSide" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#000" stop-opacity="0"/>
    <stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/>
  </linearGradient>
  <linearGradient id="sBulb" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#121212"/><stop offset=".35" stop-color="#3C3B3A"/><stop offset="1" stop-color="#0D0D0D"/>
  </linearGradient>
  <linearGradient id="sCollar" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#A9844A"/><stop offset=".35" stop-color="#F1DEB0"/><stop offset=".7" stop-color="#C9A96E"/><stop offset="1" stop-color="#8E6C3A"/>
  </linearGradient>
  <radialGradient id="sDrop" cx=".38" cy=".35" r=".7">
    <stop offset="0" stop-color="#FBE6DC"/><stop offset=".5" stop-color="#E2A893"/><stop offset="1" stop-color="#B87262"/>
  </radialGradient>`;

const BOTTLE_PATH = "M370,522 Q370,468 422,464 L578,464 Q630,468 630,522 L630,818 Q630,860 588,860 L412,860 Q370,860 370,818 Z";
const LIQUID_PATH = "M384,548 L616,548 L616,814 Q616,846 584,846 L416,846 Q384,846 384,814 Z";

/** Dropper serum bottle standing on its base at y=860. Local box 1000×1000. */
function serum({ label = true } = {}) {
  const ridges = [];
  for (let y = 356; y <= 420; y += 8) ridges.push(`<line x1="432" y1="${y}" x2="568" y2="${y}" stroke="#7A5C30" stroke-opacity=".25" stroke-width="1.5"/>`);
  return `
  <g>
    <ellipse cx="520" cy="866" rx="200" ry="22" fill="#5C4335" opacity=".35" filter="url(#blur20)"/>
    <!-- bulb -->
    <path d="M454,352 L454,250 Q454,168 500,168 Q546,168 546,250 L546,352 Z" fill="url(#sBulb)"/>
    <path d="M470,340 L470,252 Q470,196 492,186" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="7" fill="none" stroke-linecap="round"/>
    <!-- collar -->
    <rect x="430" y="344" width="140" height="90" rx="10" fill="url(#sCollar)"/>
    ${ridges.join("")}
    <!-- neck + body -->
    <rect x="452" y="430" width="96" height="40" fill="#F6E4DC" opacity=".6"/>
    <path d="${BOTTLE_PATH}" fill="#F4E2DA" opacity=".55"/>
    <path d="${LIQUID_PATH}" fill="url(#sLiquid)"/>
    <path d="${LIQUID_PATH}" fill="url(#sLiquidSide)"/>
    <ellipse cx="500" cy="548" rx="116" ry="8" fill="#F4D6CA"/>
    <path d="${BOTTLE_PATH}" fill="url(#sGlass)" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2"/>
    ${label ? `
    <rect x="402" y="612" width="196" height="150" rx="3" fill="#FBF7F1"/>
    <text x="500" y="672" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="4" fill="#3A2925">AGE MIRACLE</text>
    <line x1="470" y1="690" x2="530" y2="690" stroke="#7E0D33" stroke-width="1.5"/>
    <text x="500" y="716" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" letter-spacing="3" fill="#6E5A52">SERUM · 30 ML</text>` : ""}
    <rect x="392" y="492" width="16" height="338" rx="8" fill="#FFFFFF" opacity=".55"/>
    <rect x="604" y="510" width="6" height="300" rx="3" fill="#FFFFFF" opacity=".3"/>
  </g>`;
}

const drop = (x, y, s = 1, opacity = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
    <ellipse cx="4" cy="38" rx="20" ry="5" fill="#8A5A4C" opacity=".25" filter="url(#blur8)"/>
    <path d="M0,-34 C12,-12 22,2 22,14 A22,22 0 1 1 -22,14 C-22,2 -12,-12 0,-34 Z" fill="url(#sDrop)"/>
    <ellipse cx="-8" cy="8" rx="5" ry="8" fill="#FFFFFF" opacity=".75"/>
  </g>`;

/** Glass pipette, tip pointing down at local (500, 900). */
const pipette = () => `
  <g>
    <path d="M454,40 L454,-80 Q454,-150 500,-150 Q546,-150 546,-80 L546,40 Z" fill="url(#sBulb)"/>
    <rect x="430" y="30" width="140" height="70" rx="10" fill="url(#sCollar)"/>
    <path d="M478,100 L478,780 Q478,860 500,900 Q522,860 522,780 L522,100 Z" fill="#FFFFFF" opacity=".45" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2"/>
    <path d="M484,520 L484,780 Q484,850 500,884 Q516,850 516,780 L516,520 Z" fill="url(#sLiquid)"/>
    <rect x="483" y="110" width="6" height="640" rx="3" fill="#FFFFFF" opacity=".7"/>
  </g>`;

function leaf(x, y, r, s = 1, color = "#9BAF95") {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M0,0 C30,-40 90,-40 120,0 C90,40 30,40 0,0 Z" fill="${color}"/>
    <path d="M4,0 L116,0" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2"/></g>`;
}

function sprig(x, y, r, s = 1) {
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    leaves.push(leaf(i * 60, 0, -38, 0.55, i % 2 ? "#A7BAA1" : "#8FA48A"));
    leaves.push(leaf(i * 60 + 30, 0, 38, 0.55, i % 2 ? "#8FA48A" : "#A7BAA1"));
  }
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M-20,0 L380,0" stroke="#7C8F77" stroke-width="4" stroke-linecap="round"/>${leaves.join("")}</g>`;
}

const cream = (w, h, top = "#FBF6EF", bottom = "#EADFD2") => `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".62" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

const AURA = {
  product_image_1: [1200, 1200, () => [cream(), `<rect width="1200" height="1200" fill="url(#bg)"/>
    ${place(serum(), { x: 600, y: 560, s: 1.12 })}${grainOverlay(1200, 1200, 0.35)}`]],
  product_image_2: [1200, 1200, () => [cream(1200, 1200, "#F7EFE6", "#E6D8C9"), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <rect x="250" y="250" width="380" height="720" rx="6" fill="#000" opacity=".12" filter="url(#blur20)" transform="translate(16 14)"/>
    <rect x="250" y="250" width="380" height="720" rx="6" fill="#F3EAE0"/>
    <rect x="250" y="250" width="380" height="720" rx="6" fill="none" stroke="#E2D4C5" stroke-width="2"/>
    <rect x="250" y="520" width="380" height="64" fill="#7E0D33"/>
    <text x="440" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="24" letter-spacing="7" fill="#F6EDE3">AGE MIRACLE</text>
    <text x="440" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="4" fill="#7A6359">HYDRATING SERUM</text>
    ${place(serum(), { x: 760, y: 640, s: 0.88, r: -4 })}${grainOverlay(1200, 1200, 0.35)}`]],
  product_image_3: [1200, 1200, () => [`<radialGradient id="bg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#F8EBE5"/><stop offset="1" stop-color="#E9D3C9"/></radialGradient>`,
    `<rect width="1200" height="1200" fill="url(#bg)"/>
    ${place(pipette(), { x: 640, y: 560, s: 1.05, r: 28, ox: 500, oy: 400 })}
    ${drop(330, 880, 2.1)}${drop(470, 990, 1.1, 0.9)}${drop(250, 1040, 0.8, 0.85)}
    ${grainOverlay(1200, 1200, 0.35)}`]],
  product_image_4: [1200, 1200, () => [`${cream(1200, 1200, "#F2ECE4", "#E3D9CD")}
    <linearGradient id="tray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7DED3"/><stop offset="1" stop-color="#D2C6B8"/></linearGradient>`,
    `<rect width="1200" height="1200" fill="url(#bg)"/>
    <ellipse cx="600" cy="960" rx="480" ry="70" fill="#7A6352" opacity=".22" filter="url(#blur20)"/>
    <rect x="140" y="840" width="920" height="120" rx="60" fill="url(#tray)"/>
    <rect x="160" y="836" width="880" height="40" rx="20" fill="#EEE6DC"/>
    ${sprig(120, 820, -24, 1.15)}
    <g><ellipse cx="880" cy="862" rx="120" ry="16" fill="#5C4335" opacity=".25" filter="url(#blur8)"/>
      <rect x="770" y="740" width="220" height="120" rx="22" fill="#F8F3EC"/><rect x="760" y="712" width="240" height="44" rx="14" fill="url(#sCollar)"/></g>
    ${place(serum(), { x: 520, y: 546, s: 0.84 })}${grainOverlay(1200, 1200, 0.35)}`]],
  product_image_5: [1200, 1200, () => [cream(1200, 1200, "#F6EEE7", "#EBDDD2"), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <path d="M300,1200 L300,470 A300,300 0 0 1 900,470 L900,1200 Z" fill="#EBD9CE"/>
    ${place(serum(), { x: 600, y: 600, s: 1.2 })}${grainOverlay(1200, 1200, 0.35)}`]],
  product_highlight_1: [1000, 1000, () => [`<radialGradient id="bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#FAF3EC"/><stop offset="1" stop-color="#EBDCCF"/></radialGradient>`,
    `<rect width="1000" height="1000" fill="url(#bg)"/>
    <path d="M180,620 C300,520 460,700 620,600 C740,525 820,560 860,610" stroke="url(#sLiquid)" stroke-width="70" stroke-linecap="round" fill="none" opacity=".9"/>
    <path d="M200,600 C310,515 450,680 610,585" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/>
    ${drop(300, 330, 2.2)}${drop(560, 300, 1.4)}${drop(740, 400, 1.8)}${drop(450, 820, 1.2, 0.9)}${drop(780, 800, 0.9, 0.85)}
    ${grainOverlay(1000, 1000, 0.35)}`]],
  product_highlight_2: [1000, 1000, () => [`<radialGradient id="bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3EFEA"/></radialGradient>`,
    `<rect width="1000" height="1000" fill="url(#bg)"/>
    ${leaf(90, 700, -30, 1.5)}${leaf(720, 760, 200, 1.4, "#A7BAA1")}${leaf(760, 250, 150, 1.1)}${leaf(120, 240, 20, 1.0, "#A7BAA1")}
    <g transform="translate(200 850)"><circle r="70" fill="#F2C48D"/><circle r="58" fill="#F7DDB5"/>
      ${[0, 45, 90, 135].map((a) => `<line x1="-56" y1="0" x2="56" y2="0" stroke="#F2C48D" stroke-width="3" transform="rotate(${a})"/>`).join("")}</g>
    ${[[820, 560], [860, 620], [790, 640]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#E8B7C1"/><circle cx="${x - 4}" cy="${y - 5}" r="5" fill="#fff" opacity=".6"/>`).join("")}
    ${place(serum(), { x: 500, y: 470, s: 0.82 })}`]],
  feature_image: [1210, 1540, () => [`<radialGradient id="bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#C3CFB9"/><stop offset="1" stop-color="#A8B79E"/></radialGradient>`,
    `<rect width="1210" height="1540" fill="url(#bg)"/>
    <g opacity=".1" filter="url(#blur20)">${leaf(-40, 260, 20, 4, "#2F3B2A")}${leaf(900, 1180, 200, 3.4, "#2F3B2A")}</g>
    ${place(serum(), { x: 605, y: 700, s: 1.45 })}${grainOverlay(1210, 1540, 0.35)}`]],
  how_to_image_1: [800, 800, () => {
    const ripples = [60, 120, 190, 270].map((r, i) => `<ellipse cx="400" cy="430" rx="${r * 1.6}" ry="${r * 0.55}" fill="none" stroke="#FFFFFF" stroke-width="${6 - i}" opacity="${0.7 - i * 0.14}"/>`).join("");
    return [`<radialGradient id="bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#E6EFEC"/><stop offset="1" stop-color="#C9DAD5"/></radialGradient>`,
      `<rect width="800" height="800" fill="url(#bg)"/>${ripples}
      <g transform="translate(400 250) scale(2.2)"><path d="M0,-34 C12,-12 22,2 22,14 A22,22 0 1 1 -22,14 C-22,2 -12,-12 0,-34 Z" fill="#FFFFFF" opacity=".85"/><ellipse cx="-8" cy="8" rx="5" ry="8" fill="#FFFFFF"/></g>`];
  }],
  how_to_image_2: [800, 800, () => [`<radialGradient id="bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#F9EFE9"/><stop offset="1" stop-color="#EAD5CB"/></radialGradient>`,
    `<rect width="800" height="800" fill="url(#bg)"/>
    ${place(pipette(), { x: 400, y: 330, s: 0.55, ox: 500, oy: 500 })}
    ${drop(400, 615, 1.5)}
    <ellipse cx="400" cy="720" rx="120" ry="20" fill="url(#sLiquid)" opacity=".75"/><ellipse cx="380" cy="714" rx="50" ry="6" fill="#FFFFFF" opacity=".5"/>`]],
  how_to_image_3: [800, 800, () => [`<radialGradient id="bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#FAF4EE"/><stop offset="1" stop-color="#ECDDD1"/></radialGradient>`,
    `<rect width="800" height="800" fill="url(#bg)"/>
    <path d="M170,500 C240,330 420,300 520,360 C620,420 640,300 640,260" stroke="url(#sLiquid)" stroke-width="90" stroke-linecap="round" fill="none"/>
    <path d="M200,470 C260,340 410,320 500,370" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" fill="none" opacity=".6"/>
    ${drop(610, 560, 1.4)}${drop(250, 640, 0.9, 0.9)}`]],
};

/* ---------------------------------------------------------------- bottle (Frost) */

const BOTTLE_DEFS = `
  <linearGradient id="bWhite" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#CFD8E4"/><stop offset=".12" stop-color="#EBF0F6"/><stop offset=".3" stop-color="#FFFFFF"/>
    <stop offset=".55" stop-color="#F3F6FA"/><stop offset=".82" stop-color="#DEE5EE"/><stop offset="1" stop-color="#C3CDDA"/>
  </linearGradient>
  <linearGradient id="bCobalt" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#132A94"/><stop offset=".16" stop-color="#2447D6"/><stop offset=".32" stop-color="#5A7DFF"/>
    <stop offset=".58" stop-color="#2F5BFF"/><stop offset=".84" stop-color="#1D3CC4"/><stop offset="1" stop-color="#12298A"/>
  </linearGradient>
  <linearGradient id="bSage" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7F9183"/><stop offset=".16" stop-color="#A7B8AA"/><stop offset=".32" stop-color="#D6E1D7"/>
    <stop offset=".58" stop-color="#BACABD"/><stop offset=".84" stop-color="#97A99A"/><stop offset="1" stop-color="#788A7C"/>
  </linearGradient>
  <linearGradient id="bTint" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2F5BFF" stop-opacity=".10"/><stop offset=".3" stop-color="#2F5BFF" stop-opacity="0"/>
    <stop offset=".8" stop-color="#2F5BFF" stop-opacity="0"/><stop offset="1" stop-color="#2F5BFF" stop-opacity=".16"/>
  </linearGradient>
  <linearGradient id="bShoulder" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".10"/><stop offset=".25" stop-color="#000" stop-opacity="0"/>
    <stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/>
  </linearGradient>
  <linearGradient id="bSteel" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7E8894"/><stop offset=".3" stop-color="#F4F6F9"/><stop offset=".55" stop-color="#C3CAD3"/>
    <stop offset=".75" stop-color="#E9EDF1"/><stop offset="1" stop-color="#6F7984"/>
  </linearGradient>
  <linearGradient id="bCap" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#14298F"/><stop offset=".22" stop-color="#2F5BFF"/><stop offset=".38" stop-color="#7090FF"/>
    <stop offset=".6" stop-color="#2F5BFF"/><stop offset="1" stop-color="#132785"/>
  </linearGradient>
  <linearGradient id="bIce" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".98"/><stop offset=".45" stop-color="#E2ECFB" stop-opacity=".8"/><stop offset="1" stop-color="#B4C9EE" stop-opacity=".9"/>
  </linearGradient>
  <linearGradient id="pedTop" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9EFF8"/>
  </linearGradient>
  <linearGradient id="pedSide" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#CBD6E9"/><stop offset=".35" stop-color="#EEF2F9"/><stop offset=".7" stop-color="#DDE5F2"/><stop offset="1" stop-color="#BFCBE0"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#E4EEFF" stop-opacity=".7"/><stop offset="1" stop-color="#B9CDF3" stop-opacity=".85"/>
  </linearGradient>`;

const BODY_PATH = "M414,880 Q400,880 400,864 L400,364 C400,304 438,272 456,264 L544,264 C562,272 600,304 600,364 L600,864 Q600,880 586,880 Z";
let bottleId = 0;

/** Insulated bottle standing on its base at y=880. Local box 1000×1000. */
function bottle({ body = "bWhite", cap = true, shadow = true } = {}) {
  const id = `bc${bottleId++}`;
  const dark = body !== "bWhite";
  const grip = [];
  for (let x = 452; x <= 548; x += 8) grip.push(`<line x1="${x}" y1="176" x2="${x}" y2="236" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`);
  return `
  <g>
    <clipPath id="${id}"><path d="${BODY_PATH}"/></clipPath>
    ${shadow ? `<ellipse cx="520" cy="886" rx="170" ry="18" fill="#2A3A5C" opacity=".22" filter="url(#blur8)"/>
    <ellipse cx="500" cy="881" rx="104" ry="6" fill="#1B2640" opacity=".35" filter="url(#blur4)"/>` : ""}
    <path d="${BODY_PATH}" fill="url(#${body})"/>
    <g clip-path="url(#${id})">
      <rect x="400" y="260" width="200" height="620" fill="url(#bTint)"/>
      <rect x="400" y="260" width="200" height="620" fill="url(#bShoulder)"/>
      <rect x="400" y="260" width="200" height="620" filter="url(#grain)" opacity="${dark ? 0.9 : 0.7}"/>
      <rect x="428" y="320" width="20" height="540" rx="10" fill="#FFFFFF" opacity="${dark ? 0.35 : 0.95}" filter="url(#blur6)"/>
      <rect x="568" y="340" width="6" height="500" rx="3" fill="#FFFFFF" opacity="${dark ? 0.25 : 0.6}" filter="url(#blur4)"/>
      <ellipse cx="452" cy="300" rx="34" ry="14" fill="#FFFFFF" opacity="${dark ? 0.25 : 0.7}" filter="url(#blur6)"/>
      <rect x="400" y="852" width="200" height="28" fill="#000" opacity=".07"/>
    </g>
    <text x="500" y="836" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" letter-spacing="5" fill="${dark ? "#FFFFFF" : "#9AA6B6"}" opacity="${dark ? 0.55 : 1}">750 ML</text>
    <rect x="452" y="236" width="96" height="32" rx="3" fill="url(#bSteel)"/>
    <line x1="452" y1="246" x2="548" y2="246" stroke="#5D6773" stroke-opacity=".35" stroke-width="1.5"/>
    <line x1="452" y1="258" x2="548" y2="258" stroke="#5D6773" stroke-opacity=".35" stroke-width="1.5"/>
    ${cap ? `
    <path d="M474,170 C474,96 526,96 526,170" stroke="url(#bCap)" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M478,150 C480,112 500,106 512,108" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="440" y="150" width="120" height="92" rx="20" fill="url(#bCap)"/>
    ${grip.join("")}
    <rect x="456" y="160" width="9" height="70" rx="4.5" fill="#FFFFFF" opacity=".35"/>
    <ellipse cx="500" cy="153" rx="56" ry="6" fill="#8DA6FF" opacity=".55"/>` : `
    <ellipse cx="500" cy="238" rx="48" ry="9" fill="#3A4452"/>
    <ellipse cx="500" cy="236" rx="40" ry="6" fill="#141A22"/>`}
  </g>`;
}

/** The cap on its own, lying on its side. Local origin at its centre. */
const looseCap = (x, y, r) => `
  <g transform="translate(${x} ${y}) rotate(${r})">
    <ellipse cx="6" cy="58" rx="74" ry="11" fill="#2A3A5C" opacity=".22" filter="url(#blur8)"/>
    <path d="M-26,-30 C-26,-104 26,-104 26,-30" stroke="url(#bCap)" stroke-width="22" fill="none" stroke-linecap="round"/>
    <rect x="-60" y="-46" width="120" height="92" rx="20" fill="url(#bCap)"/>
    <rect x="-44" y="-36" width="9" height="70" rx="4.5" fill="#FFFFFF" opacity=".35"/>
  </g>`;

const cube = (x, y, s = 1, r = 0, opacity = 1) => `
  <g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" opacity="${opacity}">
    <rect x="-36" y="-30" width="80" height="80" rx="16" fill="#3A5A9C" opacity=".14" filter="url(#blur6)"/>
    <rect x="-40" y="-40" width="80" height="80" rx="16" fill="url(#bIce)" stroke="#FFFFFF" stroke-width="3"/>
    <rect x="-28" y="-28" width="56" height="56" rx="10" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2"/>
    <path d="M-24,-20 L16,-20" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".95"/>
    <path d="M-24,-4 L-24,18" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".65"/>
  </g>`;

const droplet = (x, y, s = 1, opacity = 0.85) => `
  <g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
    <path d="M0,-18 C7,-6 12,2 12,8 A12,12 0 1 1 -12,8 C-12,2 -7,-6 0,-18 Z" fill="#C9DAF8"/>
    <ellipse cx="-4" cy="5" rx="3" ry="5" fill="#FFFFFF"/>
  </g>`;

/** Round studio pedestal; its top surface is centred on (cx, top). */
const pedestal = (cx, top, rx, h) => {
  const ry = rx * 0.16;
  return `
  <g>
    <ellipse cx="${cx}" cy="${top + h + 10}" rx="${rx * 1.08}" ry="${ry * 1.1}" fill="#2A3A5C" opacity=".16" filter="url(#blur20)"/>
    <path d="M${cx - rx},${top} L${cx - rx},${top + h} A${rx},${ry} 0 0 0 ${cx + rx},${top + h} L${cx + rx},${top} Z" fill="url(#pedSide)"/>
    <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="url(#pedTop)" stroke="#FFFFFF" stroke-width="2"/>
  </g>`;
};

/** Glass of iced water; base centred on (x, base). */
const glass = (x, base, s = 1) => `
  <g transform="translate(${x} ${base}) scale(${s})">
    <ellipse cx="6" cy="4" rx="78" ry="10" fill="#2A3A5C" opacity=".18" filter="url(#blur6)"/>
    <path d="M-70,-230 L70,-230 L60,0 L-60,0 Z" fill="#FFFFFF" opacity=".35" stroke="#FFFFFF" stroke-width="3"/>
    <path d="M-66,-150 L66,-150 L60,0 L-60,0 Z" fill="url(#water)"/>
    ${cube(-20, -110, 0.55, 14, 0.95)}${cube(26, -72, 0.5, -18, 0.9)}${cube(-14, -40, 0.45, 32, 0.9)}
    <rect x="-56" y="-222" width="8" height="210" rx="4" fill="#FFFFFF" opacity=".8"/>
  </g>`;

const backdrop = (top = "#D9E4FA", mid = "#EFF4FC") => `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".62" stop-color="${mid}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
  <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;

const FROST_DEFS_EXTRA = `
  <filter id="blur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;

const FROST = {
  product_image_1: [1200, 1200, () => [backdrop(), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <circle cx="600" cy="500" r="430" fill="url(#halo)"/>
    ${pedestal(600, 880, 330, 170)}
    ${place(bottle(), { x: 600, y: 512, s: 0.97 })}
    ${cube(372, 872, 0.62, 16)}${cube(830, 866, 0.56, -22)}${cube(890, 896, 0.42, 10, 0.95)}`]],
  product_image_2: [1200, 1200, () => [backdrop("#E4EAF4", "#F3F6FA"), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <circle cx="560" cy="520" r="420" fill="url(#halo)"/>
    ${place(bottle({ body: "bCobalt" }), { x: 470, y: 560, s: 0.86 })}
    ${place(bottle({ cap: false }), { x: 700, y: 610, s: 0.9 })}
    ${looseCap(950, 1000, 82)}`]],
  product_image_3: [1200, 1200, () => [backdrop("#D3E0FA", "#EEF3FC"), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <g filter="url(#blur8)" opacity=".7">${cube(170, 980, 1.6, 18)}${cube(1060, 300, 1.3, -14)}${cube(1010, 1040, 1.1, 30)}</g>
    ${place(bottle({ shadow: false }), { x: 600, y: 700, s: 3.0, ox: 500, oy: 210 })}
    ${droplet(300, 300, 1.6)}${droplet(910, 560, 1.2)}`]],
  product_image_4: [1200, 1200, () => [`<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3EBF8"/><stop offset="1" stop-color="#F2F5FA"/></linearGradient>
      <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3EEE7"/><stop offset="1" stop-color="#E2D9CD"/></linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`,
    `<rect width="1200" height="1200" fill="url(#wall)"/>
    <path d="M700,0 L1000,0 L1200,420 L1200,760 Z" fill="url(#sun)" opacity=".75"/>
    <path d="M520,0 L640,0 L1060,760 L940,760 Z" fill="url(#sun)" opacity=".45"/>
    <rect y="760" width="1200" height="440" fill="url(#desk)"/>
    <rect y="756" width="1200" height="8" fill="#E8E0D5"/>
    ${grainOverlay(1200, 1200, 0.35)}
    <g><rect x="70" y="520" width="440" height="270" rx="16" fill="#C7CED8"/><rect x="88" y="538" width="404" height="234" rx="8" fill="#F4F7FB"/>
      <rect x="130" y="580" width="140" height="120" rx="10" fill="#DCE6FA"/><rect x="290" y="584" width="160" height="14" rx="7" fill="#C9D3E1"/><rect x="290" y="612" width="120" height="10" rx="5" fill="#DCE3EC"/>
      <path d="M20,800 L560,800 L520,780 L60,780 Z" fill="#B9C1CC"/></g>
    <g><ellipse cx="1040" cy="808" rx="100" ry="14" fill="#2A3A5C" opacity=".2" filter="url(#blur8)"/>
      <path d="M970,700 L1110,700 L1096,805 L984,805 Z" fill="#FFFFFF" stroke="#E2E7EF" stroke-width="3"/>
      ${leaf(1035, 700, -70, 1.3, "#7FA58B")}${leaf(1035, 700, -120, 1.1, "#9CBFA6")}${leaf(1035, 700, -30, 1.0, "#6E967B")}${leaf(1035, 700, -95, 1.4, "#88AD93")}</g>
    ${glass(640, 800, 0.62)}
    ${place(bottle(), { x: 800, y: 528, s: 0.62 })}`]],
  product_image_5: [1200, 1200, () => [backdrop("#C9D8FA", "#E8EFFC"), `<rect width="1200" height="1200" fill="url(#bg)"/>
    <circle cx="600" cy="520" r="420" fill="url(#halo)"/>
    ${pedestal(600, 900, 300, 160)}
    ${place(bottle({ body: "bCobalt" }), { x: 600, y: 532, s: 0.97 })}
    ${cube(400, 892, 0.55, -14)}${cube(812, 886, 0.6, 20)}`]],
  product_highlight_1: [1000, 1000, () => [backdrop("#D3E0FA"), `<rect width="1000" height="1000" fill="url(#bg)"/>
    <circle cx="500" cy="420" r="360" fill="url(#halo)"/>
    ${pedestal(500, 820, 250, 140)}
    ${place(bottle({ cap: false }), { x: 500, y: 530, s: 0.76 })}
    ${cube(470, 250, 0.8, 18)}${cube(565, 140, 0.7, -12, 0.95)}${cube(420, 70, 0.6, 30, 0.9)}
    ${droplet(380, 300, 1)}${droplet(620, 250, 0.8)}${droplet(600, 350, 0.7)}${droplet(560, 60, 0.6)}`]],
  product_highlight_2: [1000, 1000, () => [backdrop("#E1E8F5", "#F3F6FB"), `<rect width="1000" height="1000" fill="url(#bg)"/>
    <circle cx="500" cy="440" r="360" fill="url(#halo)"/>
    ${pedestal(500, 830, 250, 140)}
    ${place(bottle({ cap: false }), { x: 500, y: 560, s: 0.74 })}
    <g transform="translate(500 300)">
      <ellipse cx="0" cy="0" rx="160" ry="42" fill="none" stroke="#2F5BFF" stroke-width="6" stroke-dasharray="230 40" stroke-linecap="round" opacity=".9"/>
      <path d="M150,-26 L174,6 L134,8 Z" fill="#2F5BFF"/>
    </g>
    ${looseCap(500, 300, 0)}`]],
  product_highlight_3: [1000, 1000, () => [`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFD2F6"/><stop offset=".6" stop-color="#E6EEFB"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
      <radialGradient id="sunG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`,
    `<rect width="1000" height="1000" fill="url(#sky)"/>
    <circle cx="740" cy="230" r="200" fill="url(#sunG)"/><circle cx="740" cy="230" r="60" fill="#FFFFFF"/>
    <path d="M0,620 L180,400 L300,520 L470,330 L640,560 L780,450 L1000,640 L1000,1000 L0,1000 Z" fill="#C8D7F1"/>
    <path d="M470,330 L520,390 L490,400 L455,350 Z M180,400 L215,445 L190,450 Z" fill="#FFFFFF" opacity=".8"/>
    <path d="M0,720 L240,560 L420,690 L600,540 L820,700 L1000,620 L1000,1000 L0,1000 Z" fill="#A7BEE6"/>
    <path d="M0,840 C260,800 700,810 1000,840 L1000,1000 L0,1000 Z" fill="#F2F6FC"/>
    <ellipse cx="520" cy="842" rx="190" ry="30" fill="#8FA6CF"/>
    <ellipse cx="520" cy="836" rx="180" ry="24" fill="#B4C5E4"/>
    ${place(bottle(), { x: 520, y: 572, s: 0.7 })}`]],
  feature_image: [1000, 1250, () => [`<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6E2F8"/><stop offset="1" stop-color="#EEF3FB"/></linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`,
    `<rect width="1000" height="1250" fill="url(#wall)"/>
    <rect x="560" y="90" width="340" height="520" rx="8" fill="#F7FAFE" stroke="#FFFFFF" stroke-width="10"/>
    <line x1="730" y1="90" x2="730" y2="610" stroke="#FFFFFF" stroke-width="10"/><line x1="560" y1="350" x2="900" y2="350" stroke="#FFFFFF" stroke-width="10"/>
    <path d="M560,610 L900,610 L700,1250 L80,1250 Z" fill="url(#sun)" opacity=".6"/>
    <rect y="960" width="1000" height="290" fill="#FFFFFF" opacity=".75"/>
    ${pedestal(470, 900, 230, 120)}
    ${place(bottle(), { x: 420, y: 604, s: 0.78 })}
    ${glass(620, 905, 0.5)}`]],
  product_impact_image: [1920, 1080, () => [backdrop("#E7EDF8", "#F4F7FC"), `<rect width="1920" height="1080" fill="url(#bg)"/>
    <ellipse cx="960" cy="760" rx="760" ry="260" fill="url(#halo)"/>
    ${pedestal(700, 930, 170, 160)}${pedestal(960, 890, 190, 200)}${pedestal(1220, 950, 170, 140)}
    ${place(bottle({ body: "bSage" }), { x: 700, y: 742, s: 0.5 })}
    ${place(bottle(), { x: 960, y: 690, s: 0.53 })}
    ${place(bottle({ body: "bCobalt" }), { x: 1220, y: 762, s: 0.5 })}`]],
};

/* ---------------------------------------------------------------- render */

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const only = process.argv[2];
    for (const [dirName, scenes, defs] of [
      ["noir-assets", NOIR, WATCH_DEFS],
      ["aura-assets", AURA, SERUM_DEFS],
      ["frost-assets", FROST, BOTTLE_DEFS + FROST_DEFS_EXTRA],
    ]) {
      if (only && dirName !== `${only}-assets`) continue;
      const outDir = path.join(PUBLIC, dirName);
      fs.mkdirSync(outDir, { recursive: true });
      for (const [name, [w, h, build]] of Object.entries(scenes)) {
        const [sceneDefs, body] = build();
        const markup = svg(w, h, SHARED_DEFS + defs + sceneDefs, body);
        const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
        await page.setContent(`<!doctype html><html><body style="margin:0;background:#000">${markup}</body></html>`);
        const file = path.join(outDir, `${name}.jpg`);
        await page.screenshot({ path: file, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: w, height: h } });
        await page.close();
        console.log(`${dirName}/${name}.jpg ${w}x${h} ${Math.round(fs.statSync(file).size / 1024)} KB`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

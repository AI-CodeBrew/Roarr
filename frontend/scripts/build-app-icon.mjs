#!/usr/bin/env node
/**
 * Renders the Roarr App Store icon (1200 x 1200 PNG) from the brand lion emblem in
 * app/components/RoarrLogoMark.jsx: a full-bleed blue -> violet square (Shopify rounds the corners
 * itself) with the swept mane, faceted face and spark. No text, no transparency.
 *
 * Usage (from frontend/):  node scripts/build-app-icon.mjs
 * Writes ../app-store/roarr-app-icon-1200.png
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "app-store");
const SIZE = 1200;

// Same geometry as RoarrLogoMark.jsx (120 x 120 viewBox).
function strandPath(angle, baseRadius, tipRadius, width, sweep) {
  const cx = 60;
  const cy = 61;
  const at = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const a0 = angle - width / 2;
  const a1 = angle + width / 2;
  const tip = angle + sweep;
  return (
    `M${at(baseRadius, a0)}` +
    `Q${at((baseRadius + tipRadius) / 2 + 3, a0 + sweep * 0.25)} ${at(tipRadius, tip)}` +
    `Q${at((baseRadius + tipRadius) / 2 - 1, a1 + sweep * 0.55)} ${at(baseRadius, a1)}Z`
  );
}
const deg = (d) => (d * Math.PI) / 180;
const ANGLES = (from, to, count) => Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
const BACK = ANGLES(140, 400, 13).map((a, i) => strandPath(deg(a), 26, 51 + (i % 3) * 1.8, deg(17), deg(30)));
const MID = ANGLES(150, 390, 12).map((a, i) => strandPath(deg(a), 26, 46 + ((i + 1) % 3) * 1.6, deg(16), deg(26)));
const FRONT = ANGLES(160, 380, 11).map((a, i) => strandPath(deg(a), 26, 40 + ((i + 2) % 3) * 1.4, deg(15), deg(22)));
const FACE =
  "M60 33C69 33 77 36.5 81 43.5L84.5 55C86 63 83.5 69.5 78.5 74.5L70 85.5C66.5 91 63.5 94 60 94C56.5 94 53.5 91 50 85.5L41.5 74.5C36.5 69.5 34 63 35.5 55L39 43.5C43 36.5 51 33 60 33Z";
const EYES = ["M43.5 53.8L53.8 52.6L55.6 57.2L46 57.6Z", "M76.5 53.8L66.2 52.6L64.4 57.2L74 57.6Z"];

const layer = (strands, opacity) => strands.map((d) => `<path d="${d}" fill-opacity="${opacity}"/>`).join("");

// The emblem is drawn on a 120 x 120 grid and scaled up so the mane fills the square with margin.
const SCALE = 9.3;
const TX = SIZE / 2 - 60 * SCALE;
const TY = SIZE / 2 - 61 * SCALE; // the head is centred on y = 61

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${SIZE}" y2="${SIZE}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4338FF"/>
      <stop offset="0.55" stop-color="#5B3BF5"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <radialGradient id="shine" cx="330" cy="250" r="820" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#shine)"/>
  <g transform="translate(${TX} ${TY}) scale(${SCALE})">
    <g fill="#fff">${layer(BACK, 0.22)}${layer(MID, 0.45)}${layer(FRONT, 0.85)}</g>
    <path d="${FACE}" fill="#fff"/>
    <path d="M60 36L66.5 48.5L60 61L53.5 48.5Z" fill="#E8E9FF"/>
    <path d="M37.5 57L47 61L52.5 70.5L42.5 74Z" fill="#E8E9FF"/>
    <path d="M82.5 57L73 61L67.5 70.5L77.5 74Z" fill="#E8E9FF"/>
    <g fill="#171A65">${EYES.map((d) => `<path d="${d}"/>`).join("")}</g>
    <path d="M53 66.5H67L63.6 72.4L60 73.6L56.4 72.4Z" fill="#171A65"/>
    <path d="M60 73.6V78.4M52.6 80.6C56 84.6 60 82 60 78.4C60 82 64 84.6 67.4 80.6" fill="none" stroke="#171A65" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M56.2 58.4L54.6 66.5M63.8 58.4L65.4 66.5" stroke="#171A65" stroke-opacity="0.28" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M91 20.5L92.6 25.4L97.5 27L92.6 28.6L91 33.5L89.4 28.6L84.5 27L89.4 25.4Z" fill="#fff"/>
  </g>
</svg>`;

const { chromium } = await import("playwright");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "roarr-app-icon-1200.svg"), svg, "utf8");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.screenshot({ path: path.join(OUT, "roarr-app-icon-1200.png"), type: "png", omitBackground: false });
} finally {
  await browser.close();
}
console.log("Wrote", path.join(OUT, "roarr-app-icon-1200.png"));

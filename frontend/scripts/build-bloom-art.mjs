#!/usr/bin/env node
/**
 * Demo art for the Bloom product page card and preview: flat illustrations of a pink wellness tub, a
 * lavender bottle and soft, faceless people, drawn as SVG and rendered locally in headless Chromium.
 * No image API and no photos. The people are deliberately generic placeholders for the expert, video,
 * review and community slots a merchant fills with their own photos.
 *
 * Usage (from frontend/):
 *   node scripts/build-bloom-art.mjs                 (all)
 *   node scripts/build-bloom-art.mjs product_image_2  (some)
 *
 * Writes public/bloom-assets/*.jpg, named after the keys default-magic-responses/bloom.js points at.
 * Rebuild the card screenshots afterwards with `npx vite-node scripts/build-product-previews.mjs bloom`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "bloom-assets");

const SERIF = "Georgia, 'Times New Roman', serif";

/* ---------------------------------------------------------------- building blocks */
const defs = `
<defs>
  <linearGradient id="gPink" x1="0" x2="1"><stop offset="0" stop-color="#C93C7C"/><stop offset=".45" stop-color="#EE6AA2"/><stop offset="1" stop-color="#B82E6D"/></linearGradient>
  <linearGradient id="gPinkLid" x1="0" x2="1"><stop offset="0" stop-color="#9F2358"/><stop offset=".5" stop-color="#D44A89"/><stop offset="1" stop-color="#8E1F4E"/></linearGradient>
  <linearGradient id="gLav" x1="0" x2="1"><stop offset="0" stop-color="#4A3FA6"/><stop offset=".5" stop-color="#7B6CE0"/><stop offset="1" stop-color="#3D3391"/></linearGradient>
  <linearGradient id="gLavLid" x1="0" x2="1"><stop offset="0" stop-color="#2F2778"/><stop offset=".5" stop-color="#5A4FC4"/><stop offset="1" stop-color="#2A2370"/></linearGradient>
  <linearGradient id="gGreen" x1="0" x2="1"><stop offset="0" stop-color="#3C9A45"/><stop offset=".5" stop-color="#6FCB73"/><stop offset="1" stop-color="#318038"/></linearGradient>
  <linearGradient id="gGreenLid" x1="0" x2="1"><stop offset="0" stop-color="#256B2C"/><stop offset=".5" stop-color="#47A950"/><stop offset="1" stop-color="#1F5A25"/></linearGradient>
  <linearGradient id="gGloss" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
  <linearGradient id="gDrink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F58BB6"/><stop offset="1" stop-color="#E5518E"/></linearGradient>
  <radialGradient id="bgBlush" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#FFF1F7"/><stop offset="1" stop-color="#FFE0EE"/></radialGradient>
  <linearGradient id="bgPinkV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD7E8"/><stop offset="1" stop-color="#EA5C98"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="soft6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

/** Tub with a screw lid. (x, y) is the bottom centre; w the body width. */
function tub({ x, y, w = 300, color = "Pink", label = "petal", tilt = 0 }) {
  const h = w * 0.95;
  const lidH = w * 0.2;
  const left = x - w / 2;
  const top = y - h;
  const sub = color === "Pink" ? "#fff" : "#fff";
  return `<g transform="rotate(${tilt} ${x} ${y})">
    <ellipse cx="${x}" cy="${y + 6}" rx="${w * 0.52}" ry="${w * 0.07}" fill="#7A1F4A" opacity=".22" filter="url(#soft6)"/>
    <rect x="${left}" y="${top + lidH * 0.55}" width="${w}" height="${h - lidH * 0.55}" rx="${w * 0.1}" fill="url(#g${color})"/>
    <rect x="${left - w * 0.035}" y="${top - lidH * 0.45}" width="${w * 1.07}" height="${lidH * 1.2}" rx="${w * 0.07}" fill="url(#g${color}Lid)"/>
    <rect x="${left - w * 0.035}" y="${top + lidH * 0.28}" width="${w * 1.07}" height="${lidH * 0.14}" fill="#000" opacity=".12"/>
    <rect x="${left}" y="${top + lidH * 0.55}" width="${w}" height="${h - lidH * 0.55}" rx="${w * 0.1}" fill="url(#gGloss)"/>
    <text x="${x}" y="${top + h * 0.56}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="${w * 0.27}" fill="${sub}" letter-spacing="1">${label}</text>
    <path d="M${x - w * 0.06} ${top + h * 0.7} q${w * 0.06} -${w * 0.08} ${w * 0.12} 0 q-${w * 0.06} ${w * 0.05} -${w * 0.12} 0z" fill="#fff" opacity=".85"/>
  </g>`;
}

/** Tall bottle. */
function bottle({ x, y, w = 190, color = "Lav", label = "petal" }) {
  const h = w * 1.85;
  const left = x - w / 2;
  const top = y - h;
  return `<g>
    <ellipse cx="${x}" cy="${y + 6}" rx="${w * 0.55}" ry="${w * 0.07}" fill="#2A1F6B" opacity=".2" filter="url(#soft6)"/>
    <rect x="${x - w * 0.27}" y="${top}" width="${w * 0.54}" height="${w * 0.24}" rx="${w * 0.05}" fill="url(#g${color}Lid)"/>
    <path d="M${x - w * 0.3} ${top + w * 0.24} h${w * 0.6} q${w * 0.2} ${w * 0.08} ${w * 0.2} ${w * 0.34} V${y - w * 0.12} q0 ${w * 0.12} -${w * 0.12} ${w * 0.12} H${left + w * 0.12} q-${w * 0.12} 0 -${w * 0.12} -${w * 0.12} V${top + w * 0.58} q0 -${w * 0.26} ${w * 0.2} -${w * 0.34}z" fill="url(#g${color})"/>
    <path d="M${x - w * 0.3} ${top + w * 0.24} h${w * 0.6} q${w * 0.2} ${w * 0.08} ${w * 0.2} ${w * 0.34} V${y - w * 0.12} q0 ${w * 0.12} -${w * 0.12} ${w * 0.12} H${left + w * 0.12} q-${w * 0.12} 0 -${w * 0.12} -${w * 0.12} V${top + w * 0.58} q0 -${w * 0.26} ${w * 0.2} -${w * 0.34}z" fill="url(#gGloss)"/>
    <text transform="translate(${x + w * 0.1} ${top + h * 0.78}) rotate(-90)" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="${w * 0.34}" fill="#fff" opacity=".95">${label}</text>
  </g>`;
}

function glass({ x, y, w = 120, drink = true }) {
  const h = w * 1.5;
  return `<g>
    <ellipse cx="${x}" cy="${y + 4}" rx="${w * 0.5}" ry="${w * 0.07}" fill="#6E2A4A" opacity=".2" filter="url(#soft6)"/>
    <path d="M${x - w / 2} ${y - h} h${w} l-${w * 0.1} ${h} h-${w * 0.8}z" fill="#fff" opacity=".55" stroke="#fff" stroke-width="3"/>
    ${drink ? `<path d="M${x - w * 0.45} ${y - h * 0.78} h${w * 0.9} l-${w * 0.09} ${h * 0.78} h-${w * 0.72}z" fill="url(#gDrink)"/>` : ""}
    <path d="M${x - w * 0.34} ${y - h * 0.9} v${h * 0.7}" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>
  </g>`;
}

function scoop({ x, y, r = 46, rot = -25, powder = true }) {
  return `<g transform="rotate(${rot} ${x} ${y})">
    <rect x="${x}" y="${y - 7}" width="${r * 2.4}" height="14" rx="7" fill="#F4A9C8"/>
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.72}" fill="#F7B8D2"/>
    ${powder ? `<ellipse cx="${x}" cy="${y - 6}" rx="${r * 0.82}" ry="${r * 0.5}" fill="#FFF7FB"/>` : ""}
  </g>`;
}

function petals(seed, w, h, n = 14) {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let out = "";
  for (let i = 0; i < n; i++) {
    const px = r() * w, py = r() * h, sc = 0.5 + r() * 0.9, rot = r() * 360;
    out += `<path transform="translate(${px} ${py}) rotate(${rot}) scale(${sc})" d="M0 0 C18 -22 46 -8 40 18 C20 26 4 14 0 0z" fill="#FFB7D2" opacity="${0.35 + r() * 0.4}"/>`;
  }
  return out;
}

/** Serum bottle with a dropper cap. */
function dropper({ x, y, w = 120 }) {
  const h = w * 1.3;
  return `<g>
    <ellipse cx="${x}" cy="${y + 5}" rx="${w * 0.55}" ry="${w * 0.08}" fill="#7A1F4A" opacity=".2" filter="url(#soft6)"/>
    <rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${w * 0.16}" fill="url(#gPink)"/>
    <rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${w * 0.16}" fill="url(#gGloss)"/>
    <rect x="${x - w * 0.22}" y="${y - h - w * 0.2}" width="${w * 0.44}" height="${w * 0.24}" rx="${w * 0.05}" fill="#F3E3EA"/>
    <rect x="${x - w * 0.14}" y="${y - h - w * 0.62}" width="${w * 0.28}" height="${w * 0.46}" rx="${w * 0.14}" fill="#2B1C24"/>
    <text x="${x}" y="${y - h * 0.42}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="${w * 0.26}" fill="#fff">petal</text>
  </g>`;
}

/** White pump bottle (cleanser). */
function pump({ x, y, w = 150 }) {
  const h = w * 1.9;
  return `<g>
    <ellipse cx="${x}" cy="${y + 6}" rx="${w * 0.55}" ry="${w * 0.08}" fill="#7A1F4A" opacity=".18" filter="url(#soft6)"/>
    <rect x="${x - w * 0.14}" y="${y - h - w * 0.2}" width="${w * 0.28}" height="${w * 0.24}" fill="#E8D6DE"/>
    <rect x="${x - w * 0.06}" y="${y - h - w * 0.44}" width="${w * 0.12}" height="${w * 0.26}" fill="#D9C4CE"/>
    <path d="M${x - w * 0.06} ${y - h - w * 0.44} h${w * 0.44} v${w * 0.11} h-${w * 0.32}z" fill="#D9C4CE"/>
    <rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${w * 0.2}" fill="#FFFFFF"/>
    <rect x="${x - w / 2}" y="${y - h * 0.62}" width="${w}" height="${h * 0.3}" fill="#F7B8D2"/>
    <rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${w * 0.2}" fill="url(#gGloss)" opacity=".7"/>
    <text x="${x}" y="${y - h * 0.43}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="${w * 0.26}" fill="#B3235F">petal</text>
  </g>`;
}

/** Cream swatch. */
function swatch({ x, y, w = 160 }) {
  return `<g>
    <ellipse cx="${x}" cy="${y + 4}" rx="${w * 0.52}" ry="${w * 0.15}" fill="#C98FA8" opacity=".25" filter="url(#soft6)"/>
    <path d="M${x - w * 0.5} ${y} C${x - w * 0.3} ${y - w * 0.32} ${x + w * 0.2} ${y - w * 0.3} ${x + w * 0.5} ${y} C${x + w * 0.2} ${y + w * 0.12} ${x - w * 0.3} ${y + w * 0.12} ${x - w * 0.5} ${y}z" fill="#FFF8FB"/>
    <path d="M${x - w * 0.25} ${y - w * 0.1} q${w * 0.2} -${w * 0.08} ${w * 0.4} 0" stroke="#F3D4E1" stroke-width="${w * 0.03}" fill="none" stroke-linecap="round"/>
  </g>`;
}

/** Faceless person. Draws into a 400x500 box. */
function person({ skin = "#F2C7A5", hair = "#5B3A29", style = "long", top = "#FFFFFF", kind = "tee", bg = ["#FFE3EE", "#F8B6D2"], hold = null, tie = false }) {
  const skinD = skin === "#F2C7A5" ? "#E5B190" : skin === "#C98F69" ? "#B87D58" : "#A8704E";
  const hairBack = {
    long: `<path d="M118 262 C100 130 300 130 282 262 C296 330 292 400 270 440 L130 440 C108 400 104 330 118 262z" fill="${hair}"/>`,
    bob: `<path d="M126 255 C116 140 284 140 274 255 C282 300 276 330 262 340 L138 340 C124 330 118 300 126 255z" fill="${hair}"/>`,
    bun: `<circle cx="200" cy="140" r="30" fill="${hair}"/>`,
    short: "",
  }[style];
  const hairFront = {
    long: `<path d="M138 250 C140 170 260 170 262 250 C250 214 224 196 200 196 C174 196 150 214 138 250z" fill="${hair}"/>`,
    bob: `<path d="M136 252 C140 168 260 168 264 252 C250 212 224 194 200 194 C174 194 150 212 136 252z" fill="${hair}"/>`,
    bun: `<path d="M138 250 C140 176 260 176 262 250 C250 214 224 200 200 200 C174 200 150 214 138 250z" fill="${hair}"/>`,
    short: `<path d="M139 246 C138 180 262 180 261 246 C254 214 232 200 200 200 C168 200 146 214 139 246z" fill="${hair}"/>`,
  }[style];
  const shirt = {
    tee: `<path d="M178 372 q22 26 44 0" fill="${skinD}"/>`,
    coat: `<path d="M165 366 L200 450 L235 366 L222 358 L200 400 L178 358z" fill="#E9EEF3"/><path d="M200 400 L200 500" stroke="#CBD5DF" stroke-width="3"/><rect x="262" y="430" width="40" height="8" rx="3" fill="#CBD5DF"/>`,
    scrub: `<path d="M160 366 L200 440 L240 366 L226 358 L200 402 L174 358z" fill="#1F3F73"/><path d="M168 368 C150 430 190 470 232 430" stroke="#2B2B33" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="232" cy="430" r="9" fill="#C9CCD3"/>`,
    blouse: `<path d="M172 366 q28 36 56 0 l-8 -10 l-20 22 l-20 -22z" fill="${skinD}" opacity=".0"/><circle cx="200" cy="430" r="4" fill="#fff" opacity=".7"/><circle cx="200" cy="462" r="4" fill="#fff" opacity=".7"/>`,
  }[kind];
  const tieSvg = tie ? `<path d="M200 380 l-12 16 l12 70 l12 -70z" fill="#B3263F"/><path d="M200 380 l-10 -10 h20z" fill="#8F1D32"/>` : "";
  return `<g>
    ${hairBack}
    <path d="M30 500 C40 410 100 372 160 362 L240 362 C300 372 360 410 370 500z" fill="${top}"/>
    ${shirt}
    <rect x="173" y="296" width="54" height="76" rx="22" fill="${skinD}"/>
    <ellipse cx="200" cy="252" rx="62" ry="76" fill="${skin}"/>
    ${hairFront}
    <ellipse cx="172" cy="262" rx="7" ry="3.2" fill="#3A2420" opacity=".75"/><ellipse cx="228" cy="262" rx="7" ry="3.2" fill="#3A2420" opacity=".75"/>
    <circle cx="164" cy="286" r="11" fill="#F58BB6" opacity=".28"/><circle cx="236" cy="286" r="11" fill="#F58BB6" opacity=".28"/>
    <path d="M182 298 q18 16 36 0" stroke="#B5524A" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${tieSvg}
    ${hold === "glass" ? `<g transform="translate(262 330) scale(.9)">${glass({ x: 40, y: 150, w: 70 })}</g><ellipse cx="300" cy="420" rx="26" ry="22" fill="${skin}"/>` : ""}
    ${hold === "jar" ? `<g transform="translate(232 330) scale(.42)">${tub({ x: 150, y: 330, w: 220 })}</g><ellipse cx="300" cy="455" rx="24" ry="20" fill="${skin}"/>` : ""}
    ${hold === "cheek" ? `<rect x="226" y="316" width="40" height="120" rx="18" fill="${skinD}"/><ellipse cx="248" cy="300" rx="26" ry="32" fill="${skin}"/>` : ""}
    ${hold === "tub" ? `<g transform="translate(60 250)">${tub({ x: 140, y: 250, w: 150, color: "Pink" })}</g><ellipse cx="86" cy="440" rx="26" ry="22" fill="${skin}"/><ellipse cx="320" cy="440" rx="26" ry="22" fill="${skin}"/>` : ""}
  </g>`;
}

const bgRect = (w, h, a, b, id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;

/* ---------------------------------------------------------------- scenes */
const C = (w, h, inner) => ({ w, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}${inner}</svg>` });

const portrait = (opts, w = 800, h = 1000, bg = ["#FBE3EE", "#F3B8D1"], extra = "") =>
  C(w, h, `${bgRect(w, h, bg[0], bg[1], "pb")}<g transform="translate(${(w - 400 * (h / 500)) / 2} 0) scale(${h / 500})">${person(opts)}</g>${extra}`);

const SCENES = {
  product_image_1: () => C(1200, 1200, `<rect width="1200" height="1200" fill="url(#bgBlush)"/>${petals(3, 1200, 1200, 12)}${tub({ x: 600, y: 980, w: 560 })}`),
  product_image_2: () => C(1200, 1200, `<rect width="1200" height="1200" fill="url(#bgBlush)"/>${bottle({ x: 830, y: 960, w: 260 })}${tub({ x: 480, y: 1000, w: 520 })}`),
  product_image_3: () => C(1200, 1200, `<rect width="1200" height="1200" fill="url(#bgBlush)"/>${bottle({ x: 330, y: 940, w: 260 })}${tub({ x: 890, y: 1000, w: 400 })}${tub({ x: 590, y: 1010, w: 230, color: "Green" })}`),
  product_image_4: () => C(1200, 1200, `${bgRect(1200, 1200, "#F8E8EC", "#EFD3DB", "k1")}<rect y="820" width="1200" height="380" fill="#E8C6D0"/><rect y="816" width="1200" height="10" fill="#DDB1BF"/><circle cx="930" cy="330" r="230" fill="#fff" opacity=".55"/><circle cx="930" cy="330" r="200" fill="none" stroke="#E8C8D3" stroke-width="10"/>${swatch({ x: 220, y: 900, w: 230 })}${tub({ x: 560, y: 900, w: 380 })}${dropper({ x: 900, y: 900, w: 150 })}`),
  product_image_5: () => C(1200, 1200, `<rect width="1200" height="1200" fill="url(#bgBlush)"/>${petals(9, 1200, 1200, 18)}<ellipse cx="600" cy="1030" rx="470" ry="86" fill="#F6BFD6"/><ellipse cx="600" cy="990" rx="360" ry="70" fill="#FAD3E3"/><ellipse cx="600" cy="950" rx="250" ry="52" fill="#FDE4EE"/>${tub({ x: 600, y: 930, w: 400 })}`),
  product_highlight_1: () => C(1200, 1100, `${bgRect(1200, 1100, "#FCEAF2", "#F2C6D8", "h1")}<rect y="880" width="1200" height="220" fill="#EFCFDC"/><rect x="140" y="790" width="330" height="100" rx="22" fill="#fff"/><rect x="150" y="760" width="310" height="44" rx="18" fill="#FBEFF4"/>${pump({ x: 720, y: 900, w: 230 })}<circle cx="980" cy="420" r="16" fill="#fff" opacity=".8"/><circle cx="1030" cy="500" r="10" fill="#fff" opacity=".7"/><circle cx="950" cy="560" r="12" fill="#fff" opacity=".6"/>`),
  product_highlight_2: () => C(1200, 1100, `${bgRect(1200, 1100, "#FAE3DA", "#ECBDAB", "h2")}<g transform="rotate(-8 560 720)"><rect x="300" y="380" width="80" height="300" rx="40" fill="#F2C7A5"/><rect x="395" y="330" width="84" height="340" rx="42" fill="#F2C7A5"/><rect x="494" y="340" width="84" height="330" rx="42" fill="#F2C7A5"/><rect x="593" y="380" width="80" height="290" rx="40" fill="#F2C7A5"/><ellipse cx="500" cy="760" rx="260" ry="210" fill="#F2C7A5"/><rect x="380" y="860" width="260" height="300" fill="#F2C7A5"/></g>${swatch({ x: 520, y: 740, w: 180 })}<path d="M500 700 q22 -40 46 -6" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round"/>${tub({ x: 980, y: 1000, w: 230 })}`),
  product_highlight_3: () => C(1200, 1100, `${bgRect(1200, 1100, "#F7E9EE", "#EACFD9", "h3")}<rect x="800" y="120" width="290" height="420" rx="145" fill="#fff" opacity=".55"/><g transform="translate(230 60) scale(1.7)">${person({ skin: "#F2C7A5", hair: "#B58257", style: "long", top: "#F5D4D4", kind: "blouse", hold: "cheek" })}</g>`),
  product_impact_image: () => C(1000, 1250, `<rect width="1000" height="1250" fill="url(#bgPinkV)"/><path d="M300 0 C240 260 260 560 330 720 L405 720 C365 520 375 260 405 0z" fill="#2B1C16"/><path d="M700 0 C760 260 740 560 670 720 L595 720 C635 520 625 260 595 0z" fill="#2B1C16"/><rect x="432" y="330" width="136" height="440" rx="58" fill="#B8785A"/><ellipse cx="500" cy="120" rx="168" ry="262" fill="#C98F69"/><path d="M450 292 q50 34 100 0" stroke="#B5524A" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M150 1250 C160 980 270 740 390 706 L610 706 C730 740 840 980 850 1250z" fill="#fff"/><rect x="150" y="1180" width="700" height="70" fill="#1A1517"/>${tub({ x: 500, y: 1140, w: 330, color: "Pink" })}<ellipse cx="338" cy="1030" rx="42" ry="36" fill="#C98F69"/><ellipse cx="662" cy="1030" rx="42" ry="36" fill="#C98F69"/>`),
  avatar_1: () => portrait({ skin: "#F2C7A5", hair: "#8A5A3C", style: "long", top: "#F8CFDF", kind: "tee" }, 400, 400, ["#FBE3EE", "#F3B8D1"]),
  avatar_2: () => portrait({ skin: "#C98F69", hair: "#2B1C16", style: "bob", top: "#4B5E9A", kind: "tee" }, 400, 400, ["#E5E1F7", "#B9B0E8"]),
  avatar_3: () => portrait({ skin: "#F2C7A5", hair: "#C9A15E", style: "bun", top: "#FFFFFF", kind: "tee" }, 400, 400, ["#FDEBD6", "#F4C99A"]),
  avatar_4: () => portrait({ skin: "#A8704E", hair: "#1E1412", style: "short", top: "#E8695C", kind: "tee" }, 400, 400, ["#DDF0E1", "#9FD3A8"]),
  story_1: () => portrait({ skin: "#F2C7A5", hair: "#8A5A3C", style: "long", top: "#B6B9C0", kind: "tee", hold: "jar" }, 800, 1000, ["#E8E8EA", "#C7C7CC"]),
  story_2: () => portrait({ skin: "#F2C7A5", hair: "#7A4B2E", style: "bun", top: "#D9B99A", kind: "tee" }, 800, 1000, ["#DCDCDC", "#7E7E80"]),
  story_3: () => portrait({ skin: "#E5B190", hair: "#2B1C16", style: "bob", top: "#8F5A4A", kind: "tee", hold: "jar" }, 800, 1000, ["#E3E3E5", "#B9B9BD"]),
  story_4: () => portrait({ skin: "#F2C7A5", hair: "#5B3A29", style: "bun", top: "#C79A4D", kind: "tee", hold: "jar" }, 800, 1000, ["#8A8A8E", "#4B4B50"]),
  community: () => C(1000, 1100, `${bgRect(1000, 1100, "#E9D4D9", "#C98AA3", "cm")}<g transform="translate(-60 260) scale(1.15)">${person({ skin: "#F2C7A5", hair: "#D1AA73", style: "bob", top: "#F4E4DD", kind: "tee" })}</g><g transform="translate(250 220) scale(1.2)">${person({ skin: "#F2C7A5", hair: "#6B3F2A", style: "long", top: "#2B2B33", kind: "tee" })}</g><g transform="translate(560 270) scale(1.15)">${person({ skin: "#E5B190", hair: "#B58257", style: "long", top: "#3B3036", kind: "tee" })}</g>`),
  review_1_a: () => portrait({ skin: "#F2C7A5", hair: "#2B1C16", style: "short", top: "#1A1517", kind: "tee" }, 400, 400, ["#F4F0EE", "#D8D0CC"]),
  review_1_b: () => portrait({ skin: "#F2C7A5", hair: "#8A5A3C", style: "long", top: "#D8B89C", kind: "tee" }, 400, 400, ["#E6E0D6", "#BDB2A2"]),
  review_1_c: () => portrait({ skin: "#E5B190", hair: "#7A4B2E", style: "long", top: "#EBCDB2", kind: "tee" }, 400, 400, ["#F9DEC2", "#E7B58A"]),
  review_2_a: () => portrait({ skin: "#F2C7A5", hair: "#B58257", style: "bob", top: "#2B2B33", kind: "tee" }, 400, 400, ["#EFEFEF", "#C9C9C9"]),
  review_2_b: () => portrait({ skin: "#E5B190", hair: "#5B3A29", style: "long", top: "#A66B57", kind: "tee" }, 400, 400, ["#D7C4B6", "#9C7E6B"]),
  review_2_c: () => portrait({ skin: "#F2C7A5", hair: "#D1AA73", style: "long", top: "#F7F1EA", kind: "tee" }, 400, 400, ["#CFE2CF", "#8DB58D"]),
  review_3_a: () => portrait({ skin: "#F2C7A5", hair: "#2B1C16", style: "bun", top: "#444A55", kind: "tee" }, 400, 400, ["#EAEAEA", "#BFBFC4"]),
  review_3_b: () => portrait({ skin: "#E5B190", hair: "#3B2A22", style: "long", top: "#1F1A1D", kind: "tee" }, 400, 400, ["#E8E0DB", "#B8A79B"]),
  review_3_c: () => portrait({ skin: "#F2C7A5", hair: "#8A5A3C", style: "long", top: "#E3C7B0", kind: "tee" }, 400, 400, ["#F1D6BB", "#D4A47C"]),
  review_4_a: () => portrait({ skin: "#E5B190", hair: "#2B1C16", style: "long", top: "#F2C7CF", kind: "tee" }, 400, 400, ["#FBE3EE", "#F3B8D1"]),
  review_4_b: () => C(400, 400, `<rect width="400" height="400" fill="url(#bgBlush)"/>${tub({ x: 200, y: 330, w: 210 })}`),
  review_4_c: () => portrait({ skin: "#F2C7A5", hair: "#C9A15E", style: "bob", top: "#FFFFFF", kind: "tee" }, 400, 400, ["#F1E4DA", "#D8BBA6"]),
  review_5_a: () => portrait({ skin: "#A8704E", hair: "#1E1412", style: "bun", top: "#F7F1EA", kind: "tee" }, 400, 400, ["#E5E1F7", "#B9B0E8"]),
  review_5_b: () => C(400, 400, `${bgRect(400, 400, "#F8E8EC", "#EFD3DB", "r5")}${swatch({ x: 130, y: 300, w: 120 })}${dropper({ x: 270, y: 330, w: 90 })}`),
  review_5_c: () => portrait({ skin: "#F2C7A5", hair: "#7A4B2E", style: "long", top: "#E8695C", kind: "tee" }, 400, 400, ["#FDEBD6", "#F4C99A"]),
};

/* ---------------------------------------------------------------- render */
async function main() {
  const only = process.argv.slice(2);
  const names = only.length ? only : Object.keys(SCENES);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const name of names) {
    const make = SCENES[name];
    if (!make) { console.error("unknown scene:", name); process.exitCode = 1; continue; }
    const { w, h, svg } = make();
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
    const file = path.join(OUT_DIR, `${name}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(`${name}.jpg  ${w}x${h}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

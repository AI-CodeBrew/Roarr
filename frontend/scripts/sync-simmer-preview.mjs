#!/usr/bin/env node
/**
 * The backend roarr-simmer-* Liquid files are the source. This copies them to app/liquid for the
 * in-app preview, pointing snippet renders at the preview's snippets/ folder.
 *
 * Usage (from frontend/, after editing a Simmer section or snippet):
 *   node scripts/sync-simmer-preview.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FILES = path.resolve(ROOT, "..", "backend", "data", "assets", "shopify_files");
const LIQUID = path.join(ROOT, "app", "liquid");

const forPreview = (source) => source.replace(/\{%-?\s*render\s+'roarr-/g, (m) => m.replace("'roarr-", "'snippets/roarr-"));

function copyAll(fromDir, toDir, rename) {
  fs.mkdirSync(toDir, { recursive: true });
  const names = fs.readdirSync(fromDir).filter((n) => n.startsWith("roarr-simmer-"));
  for (const name of names) {
    fs.writeFileSync(path.join(toDir, rename(name)), forPreview(fs.readFileSync(path.join(fromDir, name), "utf8")));
  }
  return names.length;
}

const sections = copyAll(path.join(FILES, "liquid_files"), path.join(LIQUID, "packs", "simmer", "home"), (n) =>
  n.replace("roarr-simmer-", "pf-simmer-"),
);
const snippets = copyAll(path.join(FILES, "snippet_files"), path.join(LIQUID, "snippets"), (n) => n);
// The home page uses the divider twice; the preview needs a second file so each row has its own section id.
const home = path.join(LIQUID, "packs", "simmer", "home");
fs.copyFileSync(path.join(home, "pf-simmer-line.liquid"), path.join(home, "pf-simmer-line-2.liquid"));
console.log(`Synced ${sections} sections and ${snippets} snippets`);

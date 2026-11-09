#!/usr/bin/env node
/**
 * The backend roarr-lustre-* Liquid files are the source. This copies them to app/liquid for the
 * in-app preview, pointing snippet renders at the preview's snippets/ folder.
 *
 * Usage (from frontend/, after editing a Lustre section or snippet):
 *   node scripts/sync-lustre-preview.mjs
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
  const names = fs.readdirSync(fromDir).filter((n) => n.startsWith("roarr-lustre-"));
  for (const name of names) {
    fs.writeFileSync(path.join(toDir, rename(name)), forPreview(fs.readFileSync(path.join(fromDir, name), "utf8")));
  }
  return names.length;
}

const sections = copyAll(path.join(FILES, "liquid_files"), path.join(LIQUID, "packs", "lustre", "home"), (n) =>
  n.replace("roarr-lustre-", "pf-lustre-"),
);
const snippets = copyAll(path.join(FILES, "snippet_files"), path.join(LIQUID, "snippets"), (n) => n);
console.log(`Synced ${sections} sections and ${snippets} snippets`);

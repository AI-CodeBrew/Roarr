#!/usr/bin/env node
/**
 * The backend roarr-tempo-* Liquid files are the source. This copies them to app/liquid/packs/tempo/home
 * for the in-app preview (Tempo sections are self-contained, so there are no snippets to rewrite).
 *
 * Usage (from frontend/, after editing a Tempo section):
 *   node scripts/sync-tempo-preview.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FILES = path.resolve(ROOT, "..", "backend", "data", "assets", "shopify_files");
const LIQUID = path.join(ROOT, "app", "liquid");

function copyAll(fromDir, toDir, rename) {
  fs.mkdirSync(toDir, { recursive: true });
  const names = fs.readdirSync(fromDir).filter((n) => n.startsWith("roarr-tempo-"));
  for (const name of names) {
    fs.copyFileSync(path.join(fromDir, name), path.join(toDir, rename(name)));
  }
  return names.length;
}

const sections = copyAll(path.join(FILES, "liquid_files"), path.join(LIQUID, "packs", "tempo", "home"), (n) =>
  n.replace("roarr-tempo-", "pf-tempo-"),
);
console.log(`Synced ${sections} sections`);

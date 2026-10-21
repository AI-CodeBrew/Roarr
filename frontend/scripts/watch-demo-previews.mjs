#!/usr/bin/env node
/**
 * Watch demo source files and auto-rebuild HTML + card JPG + eye JPG on change.
 *
 * Usage:
 *   npm run watch:demo-previews
 *   npm run watch:demo-previews -- --category general --no-upload
 */

import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import chokidar from "chokidar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WATCH_GLOBS = [
  "app/lib/demoPreviewUrls.js",
  "app/lib/categoryHomeDefaults.js",
  "app/lib/liquidPreviewCache.js",
  "app/routes/_app.generate_store/store/utils/default-magic-responses/**/*",
  "app/routes/_app.generate_pdp/product-page/utils/default-magic-responses/**/*",
  "app/routes/_app.generate_store/store/utils/storeTemplatesConfiq.js",
  "app/routes/_app.generate_store/store/utils/buildStorePremiumPdpPreview.js",
  "app/routes/_app.generate_pdp/product-page/utils/productTemplatesConfig.js",
  "app/routes/_app.generate_pdp/product-page/utils/productAiResponeMapping.js",
  "app/utils/liquid.server.js",
  "app/utils/theme-content.js",
  "app/utils/stylePreferences.js",
  "extensions/**/*.liquid",
];

function parseArgs(argv) {
  const pass = [];
  for (let i = 0; i < argv.length; i++) {
    pass.push(argv[i]);
  }
  // Default watch rebuilds without S3 upload (faster); pass --upload to enable.
  if (!pass.includes("--no-upload") && !pass.includes("--upload")) {
    pass.push("--no-upload");
  }
  if (pass.includes("--upload")) {
    const i = pass.indexOf("--upload");
    pass.splice(i, 1);
  }
  return pass;
}

let running = false;
let pending = false;
let timer = null;

function triggerSync(extraArgs) {
  pending = true;
  clearTimeout(timer);
  timer = setTimeout(() => runSync(extraArgs), 1200);
}

function runSync(extraArgs) {
  if (running) {
    pending = true;
    return;
  }
  pending = false;
  running = true;
  console.log("\n[watch] demo sources changed → sync:demo-previews…");
  const child = spawn(
    "npx",
    ["vite-node", "scripts/sync-demo-previews.mjs", ...extraArgs],
    { cwd: ROOT, stdio: "inherit", shell: false },
  );
  child.on("close", (code) => {
    running = false;
    console.log(`[watch] sync finished (exit ${code ?? "?"})`);
    if (pending) triggerSync(extraArgs);
  });
}

const extraArgs = parseArgs(process.argv.slice(2));
console.log("Watching demo sources for HTML/JPG/eye rebuild…");
console.log(WATCH_GLOBS.map((g) => `  - ${g}`).join("\n"));
console.log(`Sync args: ${extraArgs.join(" ") || "(none)"}`);

const watcher = chokidar.watch(WATCH_GLOBS, {
  cwd: ROOT,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
});

watcher.on("all", (event, filePath) => {
  // Avoid feedback loop when sync bumps DEMO_PREVIEW_VERSION.
  if (String(filePath).endsWith("demoPreviewUrls.js") && event === "change") {
    // Still rebuild — version bump is intentional; debounce coalesces.
  }
  console.log(`[watch] ${event} ${filePath}`);
  triggerSync(extraArgs);
});

watcher.on("error", (err) => {
  console.error("[watch] error", err);
});

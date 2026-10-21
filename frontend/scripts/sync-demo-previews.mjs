#!/usr/bin/env node
/**
 * Bump DEMO_PREVIEW_VERSION (today's date), rebuild HTML + card JPG + eye JPG,
 * optionally upload to S3.
 *
 * Usage (from kluck-embeded):
 *   npm run sync:demo-previews
 *   npm run sync:demo-previews -- --category general
 *   npm run sync:demo-previews -- --no-upload
 *   npm run sync:demo-previews -- --no-bump
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const URLS_FILE = path.join(ROOT, "app/lib/demoPreviewUrls.js");

function parseArgs(argv) {
  const args = {
    category: null,
    upload: true,
    bump: true,
    skipThumbs: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--no-upload") args.upload = false;
    if (argv[i] === "--no-bump") args.bump = false;
    if (argv[i] === "--skip-thumbs") args.skipThumbs = true;
    if (argv[i] === "--category" && argv[i + 1]) {
      args.category = argv[++i];
    }
  }
  return args;
}

function todayVersion() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bumpVersionInFile() {
  const next = todayVersion();
  let src = fs.readFileSync(URLS_FILE, "utf8");
  const match = src.match(
    /export const DEMO_PREVIEW_VERSION\s*=\s*["']([^"']+)["']/,
  );
  if (!match) {
    throw new Error("Could not find DEMO_PREVIEW_VERSION in demoPreviewUrls.js");
  }
  const prev = match[1];
  if (prev === next) {
    console.log(`DEMO_PREVIEW_VERSION already ${next}`);
    return next;
  }
  src = src.replace(
    /export const DEMO_PREVIEW_VERSION\s*=\s*["'][^"']+["']/,
    `export const DEMO_PREVIEW_VERSION = "${next}"`,
  );
  fs.writeFileSync(URLS_FILE, src, "utf8");
  console.log(`Bumped DEMO_PREVIEW_VERSION ${prev} → ${next}`);
  return next;
}

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: opts.cwd || ROOT,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${cmdArgs.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.bump) bumpVersionInFile();

  const prebuildArgs = ["vite-node", "scripts/prebuild-demo-previews.mjs"];
  if (args.category) {
    prebuildArgs.push("--category", args.category);
  }
  if (args.skipThumbs) prebuildArgs.push("--skip-thumbs");

  console.log("\n→ Building HTML + JPG + eye JPG…");
  await run("npx", prebuildArgs);

  if (!args.upload) {
    console.log("\nSkipped upload (--no-upload). When ready:");
    console.log(
      "  python ../kluck-ai/backend/scripts/upload_demo_previews_to_s3.py",
    );
    return;
  }

  const uploadScript = path.resolve(
    ROOT,
    "../kluck-ai/backend/scripts/upload_demo_previews_to_s3.py",
  );
  if (!fs.existsSync(uploadScript)) {
    console.warn(`Upload script missing: ${uploadScript}`);
    return;
  }

  console.log("\n→ Uploading to S3…");
  try {
    await run("python3", [uploadScript], {
      cwd: path.dirname(uploadScript),
    });
  } catch (err) {
    console.warn(
      `[upload] failed (${err?.message || err}). Assets are in scripts/demo-preview-out/ — retry upload when AWS creds are available.`,
    );
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const html = new URL(
  "./demo-preview-out/2026-09-20/store/cinematic-home/health_beauty.html",
  import.meta.url,
).href;
const out = fileURLToPath(
  new URL("./demo-preview-out/2026-09-20/store/cinematic-home/health_beauty.eye.jpg", import.meta.url),
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await page.goto(html, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.addStyleTag({
  content: `
    [class*="marquee"] *,
    [class*="ticker"] *,
    .ca-track,
    .cft-track,
    .ct-mobile-track {
      animation: none !important;
      transform: none !important;
    }
    #csb-section_pf_cinematic_sticky_bar,
    [id^="csb-"] { display: none !important; }
    .cfo-mobile-cards { scroll-behavior: auto !important; }
  `,
});
const info = await page.evaluate(async () => {
  const skip = (img) =>
    !!img.closest(
      ".cfo-mobile-cards, .ca-track, .cft-track, .ct-mobile",
    );
  for (const img of document.querySelectorAll("img[src]")) {
    img.loading = "eager";
    img.removeAttribute("loading");
    if (!skip(img)) img.scrollIntoView({ block: "center", inline: "nearest" });
  }
  const pending = [...document.querySelectorAll("img[src]")].map(
    (img) =>
      new Promise((resolve) => {
        const done = () => resolve(img);
        if (img.complete && img.naturalWidth > 0) done();
        else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      }),
  );
  await Promise.all(pending);
  window.scrollTo(0, 0);
  document.querySelectorAll(".cfo-mobile-cards").forEach((el) => {
    el.scrollLeft = 0;
  });
  const hero = document.querySelector("#ch-section_pf_cinematic_hero .ch-banner--desktop");
  const hr = hero ? hero.getBoundingClientRect() : null;
  return {
    hero: hr
      ? { w: Math.round(hr.width), h: Math.round(hr.height) }
      : null,
    pageH: document.documentElement.scrollHeight,
    broken: [...document.querySelectorAll("img[src]")]
      .filter((img) => !(img.complete && img.naturalWidth > 0))
      .map((img) => img.currentSrc || img.src),
  };
});
console.log(JSON.stringify(info));
await page.waitForTimeout(400);
await page.screenshot({
  path: out,
  type: "jpeg",
  quality: 78,
  fullPage: true,
  animations: "disabled",
});
await page.locator("#cfo-section_pf_cinematic_feature_orbit").screenshot({
  path: "/tmp/linen-eye/vel-hb-new-orbit.jpg",
  type: "jpeg",
  quality: 80,
});
await page.locator("#ch-section_pf_cinematic_hero").screenshot({
  path: "/tmp/linen-eye/vel-hb-new-hero.jpg",
  type: "jpeg",
  quality: 80,
});
await browser.close();
console.log("wrote", out);

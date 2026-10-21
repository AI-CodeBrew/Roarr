import { chromium } from "playwright";

const root =
  "/Users/macbook/Documents/Projects/KluckAI/kluck-embeded/scripts/demo-preview-out/2026-09-20/store/luminous-home";
const cats = [
  "general",
  "fashion",
  "health_beauty",
  "home_kitchen",
  "kids_toys",
  "car_accessories",
];

const browser = await chromium.launch({ headless: true });

for (const cat of cats) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${root}/${cat}.html`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.addStyleTag({
    content: `
      [class*="marquee"] *,
      .mq-track, .tb-track, .hl-marquee-track, .kluck-marquee-inner {
        animation: none !important;
        transform: none !important;
      }
      [id^="ih-"] .ih-img { opacity: 1 !important; transform: none !important; }
      [data-hero-peek-slider] .hs-bg-img {
        animation: none !important;
        transform: none !important;
      }
      [id^="pf-faq-split-"] .faq-image-col { position: static !important; }
      .custom-iwt .iwt-image-grid img { height: auto !important; }
      [id^="sb-"] .sb-image-wrap { position: relative; min-height: 520px; height: 520px; }
      [id^="sb-"] .sb-img {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .fc-track, .fp-track, .ts-slider, .mq-track, .tb-track {
        scroll-behavior: auto !important;
      }
    `,
  });

  const info = await page.evaluate(async () => {
    const highest = window.setInterval(() => {}, 1000);
    for (let i = 0; i <= highest; i++) window.clearInterval(i);
    const slides = [...document.querySelectorAll("[data-hero-peek-slider] .hs-slide")];
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === 0);
      slide.classList.remove("prev", "next");
    });
    const scrollerSel =
      ".fc-track, .fp-track, .ts-slider, .mq-track, .tb-track, .hs-track-wrapper, [class*='marquee']";
    for (const img of document.querySelectorAll("img[src]")) {
      img.loading = "eager";
      img.removeAttribute("loading");
      if (!img.closest(scrollerSel)) {
        img.scrollIntoView({ block: "center", inline: "nearest" });
      }
    }
    await Promise.all(
      [...document.querySelectorAll("img[src]")].map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) resolve();
            else {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }
          }),
      ),
    );
    window.scrollTo(0, 0);
    document.querySelectorAll(scrollerSel).forEach((el) => {
      el.scrollLeft = 0;
    });
    document.querySelectorAll("*").forEach((el) => {
      if (getComputedStyle(el).position === "sticky") el.style.position = "static";
    });
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === 0);
      slide.classList.remove("prev", "next");
    });
    const hero = document.querySelector("[data-hero-peek-slider] .hs-track-wrapper");
    const hr = hero ? hero.getBoundingClientRect() : null;
    const tracks = ["fc-track", "fp-track", "ts-slider"].map((cls) => {
      const el = document.querySelector(`.${cls}`);
      return el
        ? { cls, scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, client: el.clientWidth }
        : null;
    });
    return {
      hero: hr ? { w: Math.round(hr.width), h: Math.round(hr.height) } : null,
      pageH: document.documentElement.scrollHeight,
      tracks,
      broken: [...document.querySelectorAll("img[src]")]
        .filter((img) => !(img.complete && img.naturalWidth > 0))
        .map((img) => (img.alt || img.src).slice(0, 80)),
    };
  });
  console.log(cat, JSON.stringify(info));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${root}/${cat}.eye.jpg`,
    type: "jpeg",
    quality: 78,
    fullPage: true,
    animations: "disabled",
  });
  await page.close();
}

await browser.close();
console.log("done");

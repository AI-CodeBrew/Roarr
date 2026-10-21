const TAG = "[A11y contrast WCAG 2.1 AA]";

const SELECTOR = [
  "p",
  "span",
  "a",
  "button",
  "label",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "td",
  "th",
  "input",
  "textarea",
  "select",
  "legend",
  "figcaption",
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="heading"]',
].join(", ");

function getLuminance(r, g, b) {
  const s = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

function parseColor(color) {
  if (!color || color === "transparent") return null;
  const m = color.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const a = m[3] !== undefined ? parseFloat(m[3]) : 1;
  return [Number(m[0]), Number(m[1]), Number(m[2]), a];
}

function blendOver(top, bottom) {
  const [tr, tg, tb, ta] = top;
  const [br, bg, bb, ba] = bottom;
  const outA = ta + ba * (1 - ta);
  if (outA <= 0) return [255, 255, 255, 1];
  return [
    Math.round((tr * ta + br * ba * (1 - ta)) / outA),
    Math.round((tg * ta + bg * ba * (1 - ta)) / outA),
    Math.round((tb * ta + bb * ba * (1 - ta)) / outA),
    outA,
  ];
}

function getEffectiveBackgroundRgb(el) {
  const layers = [];
  for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
    const bg = parseColor(getComputedStyle(node).backgroundColor);
    if (!bg || bg[3] <= 0) continue;
    layers.push(bg);
    if (bg[3] >= 0.999) break;
  }
  let acc = [255, 255, 255, 1];
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    acc = blendOver(layers[i], acc);
  }
  return [acc[0], acc[1], acc[2]];
}

function getContrastRatio(c1, c2) {
  const l1 = getLuminance(c1[0], c1[1], c1[2]);
  const l2 = getLuminance(c2[0], c2[1], c2[2]);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function isLargeText(fontSizePx, fontWeight) {
  const w = fontWeight === "bold" ? 700 : parseInt(fontWeight, 10) || 400;
  return fontSizePx >= 24 || (w >= 700 && fontSizePx >= 18.67);
}

function clearMarks(el) {
  el.removeAttribute("data-a11y-fail");
  el.style.outline = "";
  el.style.outlineOffset = "";
}

export function initA11yContrastScanner() {
  let frame = null;

  function scan() {
    const els = document.querySelectorAll(SELECTOR);
    for (const el of els) {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || parseFloat(style.opacity) === 0) {
        clearMarks(el);
        continue;
      }

      const fg = parseColor(style.color);
      if (!fg) {
        clearMarks(el);
        continue;
      }
      const bgRgb = getEffectiveBackgroundRgb(el);
      const fgRgb = fg[3] < 1 ? blendOver(fg, [...bgRgb, 1]).slice(0, 3) : [fg[0], fg[1], fg[2]];
      const ratio = getContrastRatio(fgRgb, bgRgb);
      const threshold = isLargeText(parseFloat(style.fontSize), style.fontWeight) ? 3 : 4.5;

      if (ratio < threshold) {
        const label = (typeof el.className === "string" && el.className.trim()) || el.tagName.toLowerCase();
        console.warn(
          `%c ${TAG}`,
          "background:#E24B4A;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600",
          `\n  Element: ${label}`,
          `\n  Ratio: ${ratio.toFixed(2)}:1 (need >= ${threshold}:1)`,
          el,
        );
        el.setAttribute("data-a11y-fail", ratio.toFixed(2));
        el.style.outline = "2px solid #E24B4A";
        el.style.outlineOffset = "2px";
      } else if (el.hasAttribute("data-a11y-fail")) {
        clearMarks(el);
      }
    }
  }

  function schedule() {
    if (frame != null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      scan();
    });
  }

  const observer = new MutationObserver(schedule);
  const observeOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] };
  const attachObserver = () => {
    if (document.body) observer.observe(document.body, observeOptions);
  };
  if (document.body) attachObserver();
  else document.addEventListener("DOMContentLoaded", attachObserver, { once: true });

  const onLoad = () => schedule();
  document.addEventListener("DOMContentLoaded", onLoad);
  const t1 = setTimeout(schedule, 500);
  const t2 = setTimeout(schedule, 2000);
  schedule();

  return () => {
    observer.disconnect();
    document.removeEventListener("DOMContentLoaded", onLoad);
    clearTimeout(t1);
    clearTimeout(t2);
    if (frame != null) cancelAnimationFrame(frame);
    for (const el of document.querySelectorAll("[data-a11y-fail]")) clearMarks(el);
  };
}

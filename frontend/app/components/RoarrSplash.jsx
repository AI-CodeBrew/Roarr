import RoarrLogoMark from "./RoarrLogoMark";

/**
 * App loading splash: a ~9s brand reveal. Particles gather into the ROARR lion, it roars, and the
 * roar sets off a Shopify store assembling around it. Everything is CSS on one timeline (delays
 * in seconds from page load), so `SPLASH_SCRIPT` can seek it or play it out before opening the app.
 * Nothing here is interactive; a click anywhere skips the splash.
 */

const icon = (children, size = 16) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const ICONS = {
  text: icon(<path d="M4 6h16M4 12h16M4 18h10" />, 12),
  grid: icon(
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>,
    12,
  ),
  check: icon(<path d="m5 12.5 4.5 4.5L19 7.5" />, 11),
  bag: icon(
    <>
      <path d="M5 8h14l-1.2 12H6.2Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>,
    13,
  ),
  plus: icon(<path d="M12 5v14M5 12h14" />, 15),
  mic: icon(
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>,
    15,
  ),
  expand: icon(<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />, 14),
};

/** Loader captions: [text, start, duration]. The last one stays. */
const STATUS = [
  ["Preparing your workspace…", 0.3, 2.1],
  ["Generating your store…", 2.4, 1.9],
  ["Designing your product pages…", 4.3, 1.7],
  ["Optimizing your storefront…", 6.0, 1.4],
  ["Almost ready…", 7.4, 1.0],
  ["Welcome to ROARR", 8.4, 0],
];

/** Particles that gather into the lion (positions around its center). */
const GATHER = Array.from({ length: 20 }, (_, i) => {
  const angle = ((i * 18 + (i % 3) * 7) * Math.PI) / 180;
  const radius = 120 + ((i * 37) % 95);
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    size: 3 + (i % 3),
    delay: 0.1 + (i % 6) * 0.09,
  };
});

/** Sparse background particles: [left %, top %, size, twinkle delay]. They scatter on the roar. */
const DRIFT = [
  [9, 18, 4, 0], [18, 74, 3, 1.2], [29, 9, 3, 2.1], [37, 88, 4, 0.6], [63, 7, 3, 1.8],
  [71, 90, 4, 2.6], [82, 22, 3, 0.9], [90, 70, 4, 1.5], [5, 50, 3, 2.3], [95, 42, 3, 0.3],
  [46, 94, 3, 1.1], [56, 4, 3, 2.8],
];

/** Faint lines tying the fragments to the center (orbit coordinates, origin = screen center). */
const LINKS = [
  "M-280 -40C-200 -60 -140 -100 -80 -100",
  "M-270 -258C-180 -250 -110 -220 -55 -160",
  "M-230 235C-200 200 -170 150 -135 135",
  "M80 -100C140 -100 200 -70 280 -60",
  "M55 -160C120 -230 230 -270 330 -270",
  "M135 135C250 160 380 150 470 130",
];

/**
 * Signals the lion sends out as the AI "builds" each fragment: Product → Store → SEO → Mobile.
 * [path from the logo to the fragment, end point, arrives at (s), travel time (s)]. They run along
 * the faint links above (same curves, reversed where needed) at one speed (~380 px/s) and land on
 * each fragment's `active` time.
 */
const PULSES = [
  ["M-80 -100C-140 -100 -200 -60 -280 -40", [-280, -40], 5.9, 0.55],
  ["M80 -100C140 -100 200 -70 280 -60", [280, -60], 6.7, 0.55],
  ["M55 -160C120 -230 230 -270 330 -270", [330, -270], 6.95, 0.8],
  ["M135 135C250 160 380 150 470 130", [470, 130], 7.45, 0.9],
];

/**
 * The network stays alive once it is drawn: small particles stream from the lion out to every
 * fragment along its link. [path from the logo to the fragment, seconds per trip].
 */
const FLOWS = [
  ["M-80 -100C-140 -100 -200 -60 -280 -40", 2.6],
  ["M-55 -160C-110 -220 -180 -250 -270 -258", 3.1],
  ["M-135 135C-170 150 -200 200 -230 235", 3.0],
  ["M80 -100C140 -100 200 -70 280 -60", 2.7],
  ["M55 -160C120 -230 230 -270 330 -270", 3.2],
  ["M135 135C250 160 380 150 470 130", 3.4],
];

/** Rings off the lion: the roar (three), then one as each part of the store starts being built. */
const ROAR_WAVES = [1.85, 2.02, 2.2, 5.3, 6.1, 6.5];

/** A signal is a short comet: stacked dashes ending on the same head. [length, opacity, width, color]. */
const COMET = [
  [0.26, 0.22, 2, "#7c3aed"],
  [0.14, 0.5, 2.2, "#8b5cf6"],
  [0.05, 1, 2.8, "#ffffff"],
];

const s = (n) => `${n}s`;

function Stars() {
  return (
    <span className="rs-stars" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" width="9" height="9">
          <path d="M10 1.6 12.6 7l5.9.6-4.4 4 1.3 5.8L10 14.4l-5.4 3 1.3-5.8-4.4-4L7.4 7Z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/** A piece of UI that shows a skeleton, then snaps in at `at` seconds. */
function Slot({ at, className = "", children }) {
  return (
    <div className={`rs-slot ${className}`} style={{ "--d": s(at) }}>
      <div className="rs-slot__in">{children}</div>
    </div>
  );
}

/**
 * A floating fragment. `x`/`y` place it relative to the screen center; it enters from the center
 * at `enter` (pushed out by the roar), glows when the beam reaches it at `active`, and shows a
 * short status `chip` at that moment.
 */
function Fragment({ name, x, y, width, enter, active, chip, sway = 7, children }) {
  const fx = Math.round(-x * 0.55);
  const fy = Math.round(-y * 0.55);
  return (
    <div
      className={`rs-frag rs-frag--${name}`}
      style={{
        left: x,
        top: y,
        width,
        "--fx": `${fx}px`,
        "--fy": `${fy}px`,
        "--d": s(enter),
        "--a": active ? s(active) : undefined,
        "--sway": s(sway),
      }}
    >
      {chip && (
        <span className={`rs-chip ${chip.done ? "rs-chip--done" : ""}`} style={{ "--c": s(chip.at), "--cd": s(chip.for || 1) }}>
          {chip.done ? <i className="rs-chip__check">{ICONS.check}</i> : <i className="rs-chip__dot" />}
          {chip.text}
        </span>
      )}
      <div className="rs-frag__body">
        {active ? (
          <>
            <i className="rs-scan" />
            <i className="rs-lock" />
          </>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Orbit() {
  return (
    <div className="rs-orbit" aria-hidden>
      <svg className="rs-lines" width="1" height="1">
        {LINKS.map((d, i) => (
          <path key={d} d={d} pathLength="1" className="rs-link" style={{ "--d": s(2.5 + i * 0.08) }} />
        ))}
        {PULSES.map(([d, , arrive, dur]) => (
          <g key={d} className="rs-signal" style={{ "--d": s(arrive - dur), "--t": s(dur) }}>
            {COMET.map(([len, opacity, width, color]) => (
              <path key={len} d={d} pathLength="1" style={{ "--L": len, opacity, strokeWidth: width, stroke: color }} />
            ))}
          </g>
        ))}
      </svg>
      {PULSES.map(([d, [x, y], arrive]) => (
        <span key={d} className="rs-ping" style={{ left: x, top: y, "--d": s(arrive - 0.05) }} />
      ))}
      {FLOWS.map(([d, dur], i) =>
        [0, 1].map((k) => (
          <span
            key={`${d}-${k}`}
            className="rs-flow"
            style={{ offsetPath: `path("${d}")`, "--d": s(3.3 + i * 0.27 + k * (dur / 2)), "--t": s(dur) }}
          />
        )),
      )}

      <Fragment name="desc" x={-470} y={-300} width={200} enter={2.2} sway={8}>
        <p className="rs-label">{ICONS.text} Product description</p>
        <span className="rs-type-line" style={{ "--w": "94%", "--d": s(4.7) }} />
        <span className="rs-type-line" style={{ "--w": "80%", "--d": s(4.85) }} />
        <span className="rs-type-line" style={{ "--w": "56%", "--d": s(5) }} />
      </Fragment>

      <Fragment
        name="product"
        x={-520}
        y={-170}
        width={240}
        enter={2.15}
        active={5.9}
        chip={{ text: "Generating Product Page", at: 5.85, for: 0.95 }}
        sway={7}
      >
        <div className="rs-window"><i /><i /><i /><span>/products/pour-over-set</span></div>
        <div className="rs-pc">
          <Slot at={4.5} className="rs-pc__media">
            <img src="/splash/product.webp" alt="" width="360" height="360" />
          </Slot>
          <Slot at={4.8} className="rs-pc__title">Ceramic Pour-Over Set</Slot>
          <Slot at={5.6} className="rs-pc__reviews">
            <Stars /> <span>4.9 · 1,284 reviews</span>
          </Slot>
          <Slot at={5.1} className="rs-pc__price">
            <b>$48.00</b> <s>$64.00</s>
          </Slot>
          <Slot at={5.4} className="rs-pc__cta">Add to Cart</Slot>
        </div>
      </Fragment>

      <Fragment name="collection" x={-440} y={185} width={210} enter={2.3} sway={9}>
        <p className="rs-label">{ICONS.grid} Collection</p>
        <Slot at={5.2} className="rs-col">
          <img src="/splash/store-col-1.webp" alt="" width="260" height="180" />
          <img src="/splash/store-col-2.webp" alt="" width="260" height="180" />
          <img src="/splash/product.webp" alt="" width="360" height="360" />
        </Slot>
        <Slot at={5.35} className="rs-col__name">Sculptural Lighting · 24 products</Slot>
      </Fragment>

      <Fragment
        name="seo"
        x={350}
        y={-340}
        width={190}
        enter={2.25}
        active={6.95}
        chip={{ text: "Optimizing SEO", at: 6.9, for: 0.9 }}
        sway={8.5}
      >
        <div className="rs-seo">
          <svg viewBox="0 0 36 36" width="34" height="34">
            <circle cx="18" cy="18" r="14" className="rs-seo__track" />
            <circle cx="18" cy="18" r="14" pathLength="100" className="rs-seo__fill" />
          </svg>
          <div>
            <b>SEO 98</b>
            <span>Meta, schema & alt text</span>
          </div>
        </div>
      </Fragment>

      <Fragment
        name="store"
        x={280}
        y={-190}
        width={310}
        enter={2.1}
        active={6.7}
        chip={{ text: "Designing Store", at: 6.65, for: 0.95 }}
        sway={7.5}
      >
        <span className="rs-chip rs-chip--done rs-chip--ready" style={{ "--c": s(7.95) }}>
          <i className="rs-chip__check">{ICONS.check}</i> Ready
        </span>
        <div className="rs-window"><i /><i /><i /><span>lumenook.store</span></div>
        <div className="rs-sf">
          <Slot at={5.0} className="rs-sf__nav">
            <b>LUMENOOK</b>
            <span>Shop</span>
            <span>Lighting</span>
            <span>Objects</span>
            <span>About</span>
          </Slot>
          <Slot at={5.3} className="rs-sf__hero">
            <img src="/splash/store-hero.webp" alt="" width="520" height="300" />
            <span className="rs-sf__hero-copy">
              <b>Light, considered.</b>
              <em>Shop the collection</em>
            </span>
          </Slot>
          <Slot at={5.7} className="rs-sf__cols">
            <span><img src="/splash/store-col-1.webp" alt="" width="260" height="180" /><em>Sculptural Lighting</em></span>
            <span><img src="/splash/store-col-2.webp" alt="" width="260" height="180" /><em>Desk Objects</em></span>
          </Slot>
        </div>
      </Fragment>

      <Fragment
        name="mobile"
        x={470}
        y={40}
        width={112}
        enter={7.0}
        active={7.45}
        chip={{ text: "Connecting Shopify", at: 7.4, for: 0.9 }}
        sway={6.5}
      >
        <div className="rs-phone">
          <span className="rs-phone__notch" />
          <div className="rs-phone__nav"><b>LUMENOOK</b><i /></div>
          <img className="rs-phone__hero" src="/splash/store-hero.webp" alt="" width="520" height="300" />
          <div className="rs-phone__grid">
            <img src="/splash/product.webp" alt="" width="360" height="360" />
            <img src="/splash/store-col-1.webp" alt="" width="260" height="180" />
          </div>
          <span className="rs-phone__cta">Add to Cart</span>
        </div>
      </Fragment>
    </div>
  );
}

export default function RoarrSplash() {
  return (
    <div className="lcp-splash" aria-hidden="false" aria-live="polite" suppressHydrationWarning>
      <div className="rs-bg" aria-hidden>
        <span className="rs-blob rs-blob--a" />
        <span className="rs-blob rs-blob--b" />
        <span className="rs-blob rs-blob--c" />
        <span className="rs-flash" />
        <span className="rs-grain" />
        {DRIFT.map(([x, y, size, delay]) => (
          <span
            key={`${x}-${y}`}
            className="rs-drift"
            style={{ left: `${x}%`, top: `${y}%`, "--dx": `${Math.round((x - 50) * 2.4)}px`, "--dy": `${Math.round((y - 50) * 2.4)}px` }}
          >
            <i style={{ width: size, height: size, animationDelay: s(delay) }} />
          </span>
        ))}
      </div>

      <div className="rs-scene">
        <Orbit />

        <div className="rs-center">
          <div className="rs-stage">
            <span className="rs-halo" aria-hidden />
            {GATHER.map((p) => (
              <span
                key={`${p.x}-${p.y}`}
                className="rs-gather"
                aria-hidden
                style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, "--d": s(p.delay), width: p.size, height: p.size }}
              />
            ))}
            {ROAR_WAVES.map((at) => (
              <span key={at} className="rs-wave" aria-hidden style={{ "--d": s(at) }} />
            ))}
            <span className="rs-wave rs-wave--idle" aria-hidden />
            <div className="rs-lion">
              <RoarrLogoMark size={150} animated title="Roarr" />
            </div>
          </div>

          <div className="rs-wordmark" aria-hidden>
            {"ROARR".split("").map((ch, i) => (
              <span key={i} style={{ "--x": `${(i - 2) * 34}px`, "--d": s(2.8 + i * 0.06) }}>
                {ch}
              </span>
            ))}
            <span className="rs-wordmark__sheen">
              {"ROARR".split("").map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </span>
          </div>

          <h1 className="rs-msg">
            <span className="rs-msg__main">Create Stunning Shopify Stores</span>
            <span className="rs-msg__ai">with AI</span>
          </h1>

          <div className="rs-loader" aria-hidden>
            <span className="rs-loader__fill">
              <span className="rs-loader__spark" />
            </span>
          </div>
          <div className="rs-status">
            {STATUS.map(([text, at, dur]) => (
              <span
                key={text}
                className={dur ? "rs-status__item" : "rs-status__item rs-status__item--last"}
                style={{ "--d": s(at), "--t": s(dur) }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <span className="rs-shopify" aria-hidden>
        <i>{ICONS.bag}</i> Built for Shopify
      </span>

      <div className="rs-assist" aria-hidden>
        <RoarrLogoMark size={24} />
        <span className="rs-assist__text">✦ Work with Roarr</span>
        <span className="rs-assist__tools">
          {ICONS.plus}
          {ICONS.mic}
          {ICONS.expand}
        </span>
      </div>
    </div>
  );
}

/**
 * Runs right after the splash markup, before React loads. The first load in a browser session
 * plays the full reveal (about 9s, or until a click); later loads seek past the intro and close as
 * soon as the app dispatches `app-ready`. Closing plays the "open the workspace" exit, then hides.
 */
export const SPLASH_SCRIPT = `
(function () {
  var el = document.querySelector('.lcp-splash');
  if (!el) return;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var first = true;
  try {
    first = !window.sessionStorage.getItem('roarr-splash-seen');
    window.sessionStorage.setItem('roarr-splash-seen', '1');
  } catch (e) {}
  var full = first && !reduce;
  if (!full && !reduce && el.getAnimations) {
    try { el.getAnimations({ subtree: true }).forEach(function (a) { a.currentTime = 3400; }); } catch (e) {}
  }
  var start = Date.now();
  var minMs = full ? 9000 : 0;
  var closed = false;
  function close() {
    if (closed) return;
    closed = true;
    el.classList.add('is-exiting');
    setTimeout(function () { el.setAttribute('aria-hidden', 'true'); }, reduce ? 0 : 900);
  }
  function ready() {
    var wait = minMs - (Date.now() - start);
    if (wait > 0) setTimeout(close, wait); else close();
  }
  window.addEventListener('app-ready', ready, { once: true });
  window.addEventListener('load', function () { setTimeout(ready, 50); });
  setTimeout(close, full ? 12000 : 4000);
  el.addEventListener('click', close);
})();
`;

export const SPLASH_STYLES = `
  .lcp-splash {
    --rs-blue: #4338FF;
    --rs-navy: #171A65;
    --rs-violet: #7C3AED;
    --rs-lav: #E8E9FF;
    --rs-green: #20C997;
    --rs-muted: #5b5f8f;
    --rs-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --rs-sw: 1;
    --rs-sh: 1;
    --lion: 150px;
    position: fixed;
    inset: 0;
    z-index: 9999;
    overflow: hidden;
    cursor: default;
    background: #fbfbff;
    color: var(--rs-navy);
    font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    transition: opacity 0.6s ease 0.25s, visibility 0.6s 0.25s;
  }
  .lcp-splash.is-exiting,
  .lcp-splash[aria-hidden="true"] { opacity: 0; pointer-events: none; }
  .lcp-splash[aria-hidden="true"] { visibility: hidden; }
  .lcp-splash * { box-sizing: border-box; }
  .lcp-splash p, .lcp-splash h1 { margin: 0; }
  .lcp-splash img { display: block; width: 100%; height: 100%; object-fit: cover; }

  /* ---------- Background ---------- */
  .rs-bg { position: absolute; inset: 0; pointer-events: none; animation: rs-fade 1s ease both; }
  .rs-blob { position: absolute; border-radius: 999px; filter: blur(90px); }
  .rs-blob--a { width: 620px; height: 620px; left: -180px; top: 10%; background: rgba(67, 56, 255, 0.13); animation: rs-drift-a 16s ease-in-out infinite alternate; }
  .rs-blob--b { width: 640px; height: 640px; right: -200px; top: -8%; background: rgba(124, 58, 237, 0.13); animation: rs-drift-b 18s ease-in-out infinite alternate; }
  .rs-blob--c { width: 760px; height: 520px; left: calc(50% - 380px); top: calc(50% - 300px); background: rgba(225, 226, 255, 0.95); filter: blur(70px); }
  .rs-flash {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: radial-gradient(60% 55% at 50% 42%, rgba(124, 58, 237, 0.24), rgba(67, 56, 255, 0.1) 45%, transparent 75%);
    animation: rs-flash 1.3s ease-out 1.9s both;
  }
  .rs-grain {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .rs-drift { position: absolute; animation: rs-scatter 1.6s var(--rs-ease) 1.9s both; }
  .rs-drift i {
    display: block;
    border-radius: 999px;
    background: var(--rs-blue);
    box-shadow: 0 0 10px rgba(67, 56, 255, 0.6);
    animation: rs-twinkle 5s ease-in-out infinite;
  }

  /* ---------- Scene (camera) ---------- */
  .rs-scene { position: absolute; inset: 0 0 64px; animation: rs-camera 1.3s var(--rs-ease) 1.85s both; }
  .rs-center {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(560px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transform: translate(-50%, -50%);
  }

  /* ---------- Lion ---------- */
  .rs-stage { position: relative; display: grid; place-items: center; width: var(--lion); height: var(--lion); }
  .rs-halo {
    position: absolute;
    inset: -60%;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.26), rgba(67, 56, 255, 0.08) 45%, transparent 68%);
    animation: rs-halo 1.2s ease-out both, rs-breathe 4s ease-in-out 2.6s infinite;
  }
  .rs-gather {
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -2px 0 0 -2px;
    border-radius: 999px;
    opacity: 0;
    background: var(--rs-violet);
    box-shadow: 0 0 8px rgba(124, 58, 237, 0.8);
    animation: rs-gather 1.15s cubic-bezier(0.55, 0, 0.75, 0.4) var(--d) both;
  }
  .rs-wave {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    opacity: 0;
    border: 2px solid rgba(124, 58, 237, 0.55);
    box-shadow: 0 0 24px rgba(67, 56, 255, 0.35), inset 0 0 24px rgba(124, 58, 237, 0.25);
    animation: rs-wave 1.5s cubic-bezier(0.16, 1, 0.3, 1) var(--d) both;
  }
  .rs-wave--idle { border-width: 1px; box-shadow: none; animation: rs-wave-idle 3.6s ease-out 3.2s infinite; }
  .rs-lion {
    position: relative;
    width: var(--lion);
    height: var(--lion);
    animation:
      rs-form 0.9s var(--rs-ease) 0.75s both,
      rs-lift 0.9s cubic-bezier(0.34, 1.3, 0.64, 1) 1.55s both,
      rs-idle 4.5s ease-in-out 2.6s infinite;
  }
  .rs-lion .roarr-logo-mark { display: block; width: 100%; height: 100%; filter: drop-shadow(0 18px 30px rgba(67, 56, 255, 0.35)); }
  .rs-lion .rlm-disc { transform-origin: 60px 60px; animation: rs-disc 0.8s var(--rs-ease) 0.7s both; }
  .rs-lion .rlm-mane { transform-origin: 60px 61px; animation: rs-mane 1.3s var(--rs-ease) 1.35s both; }
  .rs-lion .rlm-strand { transform-origin: 60px 61px; animation: rs-strand 0.55s var(--rs-ease) calc(0.8s + var(--i) * 0.016s) both; }
  .rs-lion .rlm-face { transform-origin: 60px 64px; animation: rs-face 0.6s var(--rs-ease) 1.05s both; }
  .rs-lion .rlm-eyeglow { filter: drop-shadow(0 0 2.5px #8B5CF6) drop-shadow(0 0 5px #4338FF); animation: rs-eyes 1.6s ease-in-out 1.25s both; }
  .rs-lion .rlm-roar { transform-origin: 60px 75px; animation: rs-roar 0.75s cubic-bezier(0.3, 1.4, 0.6, 1) 1.82s both; }
  .rs-lion .rlm-spark { transform-origin: 91px 27px; animation: rs-spark 0.6s var(--rs-ease) 2.3s both, rs-twinkle-spark 2.6s ease-in-out 3s infinite; }

  /* ---------- Wordmark + message ---------- */
  .rs-wordmark { position: relative; margin-top: 22px; font-size: 40px; font-weight: 800; line-height: 1; letter-spacing: 0.16em; padding-left: 0.16em; }
  .rs-wordmark > span:not(.rs-wordmark__sheen) {
    display: inline-block;
    color: var(--rs-navy);
    animation: rs-letter 0.75s var(--rs-ease) var(--d) both;
  }
  .rs-wordmark__sheen {
    position: absolute;
    inset: 0;
    padding-left: 0.16em;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 35%, #6c5cff 47%, #c4b5fd 50%, #8b5cf6 53%, transparent 65%);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: rs-sheen 1.1s ease-in-out 3.3s both;
  }
  .rs-wordmark__sheen span { display: inline-block; }
  .rs-msg { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-top: 18px !important; }
  .rs-msg__main {
    font-size: clamp(22px, 2.5vw, 32px);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: var(--rs-navy);
    animation: rs-msg 0.85s var(--rs-ease) 3.5s both;
  }
  .rs-msg__ai {
    font-size: clamp(17px, 1.8vw, 23px);
    font-weight: 600;
    background: linear-gradient(90deg, var(--rs-blue), var(--rs-violet));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: rs-msg 0.85s var(--rs-ease) 3.9s both;
  }

  /* ---------- Loader ---------- */
  .rs-loader {
    position: relative;
    width: 240px;
    height: 3px;
    margin-top: 26px;
    border-radius: 999px;
    background: rgba(67, 56, 255, 0.1);
    animation: rs-fade 0.6s ease 0.3s both;
  }
  .rs-loader__fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    overflow: hidden;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--rs-blue), var(--rs-violet));
    box-shadow: 0 0 12px rgba(124, 58, 237, 0.65);
    animation: rs-fill 8.4s cubic-bezier(0.45, 0, 0.3, 1) 0.3s both, rs-glow 1.8s ease-in-out infinite;
  }
  .rs-loader__spark {
    position: absolute;
    top: -2px;
    width: 26px;
    height: 7px;
    border-radius: 999px;
    background: radial-gradient(closest-side, #fff, rgba(255, 255, 255, 0));
    animation: rs-spark-run 1.7s ease-in-out 0.9s infinite;
  }
  .rs-status { position: relative; width: 100%; height: 20px; margin-top: 12px; }
  .rs-status__item {
    position: absolute;
    inset: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--rs-muted);
    opacity: 0;
    animation: rs-caption var(--t) ease var(--d) both;
  }
  .rs-status__item--last { color: var(--rs-blue); animation: rs-caption-stay 0.6s ease var(--d) both; }

  /* ---------- Orbiting store fragments ---------- */
  .rs-orbit {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    scale: min(var(--rs-sw), var(--rs-sh));
  }
  .rs-lines { position: absolute; left: 0; top: 0; overflow: visible; }
  .rs-link {
    fill: none;
    stroke: rgba(124, 58, 237, 0.22);
    stroke-width: 1.2;
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
    animation: rs-draw 0.9s ease-out var(--d) both;
  }
  /* Signals: a short comet runs from the lion to a fragment, then a ring pings where it lands. */
  .rs-signal { filter: drop-shadow(0 0 5px rgba(124, 58, 237, 0.85)); }
  .rs-signal path {
    fill: none;
    stroke-linecap: round;
    stroke-dasharray: var(--L) 2;
    stroke-dashoffset: calc(var(--L) * 1px);
    animation: rs-signal var(--t) cubic-bezier(0.45, 0, 0.25, 1) var(--d) both;
  }
  .rs-ping {
    position: absolute;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border-radius: 999px;
    border: 2px solid rgba(124, 58, 237, 0.7);
    opacity: 0;
    animation: rs-ping 1s ease-out var(--d) forwards;
  }
  /* Living network: particles stream from the lion to each fragment, forever. */
  .rs-flow {
    position: absolute;
    left: 0;
    top: 0;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3), 0 0 10px 2px rgba(124, 58, 237, 0.7);
    offset-rotate: 0deg;
    opacity: 0;
    animation: rs-flow var(--t) linear var(--d) infinite backwards;
  }
  .rs-frag { position: absolute; z-index: 1; animation: rs-frag-in 1.05s var(--rs-ease) var(--d) both; }
  .rs-frag__body {
    position: relative;
    padding: 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 28px 56px -30px rgba(23, 26, 101, 0.42), inset 0 1px 0 #fff;
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    animation: rs-sway var(--sway) ease-in-out infinite alternate;
  }
  .rs-frag__body::after {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.55), 0 0 34px rgba(124, 58, 237, 0.4);
    animation: rs-active 1.3s ease var(--a, 999s) both;
  }
  /* Lock-on: corner brackets snap around the part being built and a light sweeps over it. */
  .rs-lock {
    position: absolute;
    inset: -9px;
    z-index: 3;
    pointer-events: none;
    opacity: 0;
    --lk: #6d4bff;
    background:
      linear-gradient(var(--lk), var(--lk)) 0 0 / 18px 2px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 0 0 / 2px 18px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 100% 0 / 18px 2px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 100% 0 / 2px 18px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 0 100% / 18px 2px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 0 100% / 2px 18px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 100% 100% / 18px 2px no-repeat,
      linear-gradient(var(--lk), var(--lk)) 100% 100% / 2px 18px no-repeat;
    filter: drop-shadow(0 0 4px rgba(109, 75, 255, 0.7));
    animation: rs-lock 2.1s cubic-bezier(0.2, 0.7, 0.2, 1) var(--a, 999s) both;
  }
  .rs-scan {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
  .rs-scan::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 42%;
    transform: translateY(-110%);
    background: linear-gradient(180deg, rgba(139, 92, 246, 0), rgba(139, 92, 246, 0.3) 78%, rgba(167, 139, 250, 0.75) 100%);
    border-bottom: 1.5px solid rgba(196, 181, 253, 0.95);
    animation: rs-scan 1.05s cubic-bezier(0.45, 0, 0.3, 1) var(--a, 999s) both;
  }
  .rs-frag--store .rs-frag__body { animation: rs-sway var(--sway) ease-in-out infinite alternate, rs-store-pop 1.1s var(--rs-ease) 7s both; }
  .rs-frag--mobile .rs-frag__body { padding: 5px; border-radius: 22px; }
  .rs-frag--seo .rs-frag__body { padding: 10px 12px; border-radius: 16px; }

  .rs-chip {
    position: absolute;
    left: 10px;
    top: -32px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    color: #fff;
    background: linear-gradient(135deg, var(--rs-blue), var(--rs-violet));
    box-shadow: 0 10px 22px -10px rgba(67, 56, 255, 0.9);
    opacity: 0;
    animation: rs-caption var(--cd) ease var(--c) both;
  }
  .rs-chip i { font-style: normal; }
  .rs-chip__dot { width: 6px; height: 6px; border-radius: 99px; background: #fff; animation: rs-pulse 0.8s ease-in-out infinite; }
  .rs-chip__check { display: grid; place-items: center; width: 15px; height: 15px; border-radius: 99px; color: #fff; background: var(--rs-green); }
  .rs-chip__check svg { width: 9px; height: 9px; stroke-width: 3.2; }
  .rs-chip--ready { left: auto; right: 10px; color: #0d6e52; background: #fff; border: 1px solid rgba(32, 201, 151, 0.35); box-shadow: 0 10px 22px -12px rgba(32, 201, 151, 0.8); animation: rs-caption-stay 0.5s var(--rs-ease) var(--c) both; }
  .rs-frag--mobile .rs-chip { left: auto; right: 0; }

  .rs-label { display: flex; align-items: center; gap: 6px; margin-bottom: 9px !important; font-size: 11px; font-weight: 700; color: var(--rs-navy); }
  .rs-label svg { color: var(--rs-blue); }
  .rs-type-line { display: block; height: 6px; margin-top: 7px; border-radius: 9px; width: var(--w); background: linear-gradient(90deg, #d9dcf7, #ecedfb); transform-origin: left; animation: rs-type-line 0.5s steps(8, end) var(--d) both; }

  .rs-window { display: flex; align-items: center; gap: 4px; margin: -2px -2px 10px; padding: 0 2px; }
  .rs-window i { width: 6px; height: 6px; border-radius: 99px; background: #d9dbef; }
  .rs-window span { flex: 1; margin-left: 5px; padding: 3px 8px; overflow: hidden; border-radius: 99px; font-size: 9px; color: #8a8db3; white-space: nowrap; text-overflow: ellipsis; background: rgba(240, 241, 252, 0.9); }

  .rs-slot { position: relative; }
  .rs-slot::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 7px;
    opacity: 0;
    background: linear-gradient(90deg, #eceefa 25%, #f6f7fd 50%, #eceefa 75%);
    background-size: 200% 100%;
    animation: rs-skeleton var(--d) linear both;
  }
  .rs-slot__in { animation: rs-snap 0.55s cubic-bezier(0.34, 1.45, 0.64, 1) var(--d) both; }

  /* Product card */
  .rs-pc { display: flex; flex-direction: column; gap: 7px; text-align: left; }
  .rs-pc__media { height: 150px; }
  .rs-pc__media .rs-slot__in { height: 100%; overflow: hidden; border-radius: 12px; background: #f1efe9; }
  .rs-pc__title { font-size: 14px; font-weight: 800; color: var(--rs-navy); }
  .rs-pc__reviews .rs-slot__in { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--rs-muted); }
  .rs-stars { display: inline-flex; gap: 1px; color: #f5a524; }
  .rs-pc__price { font-size: 15px; font-weight: 800; color: var(--rs-navy); }
  .rs-pc__price s { margin-left: 4px; font-size: 11px; font-weight: 500; color: #9a9cbd; }
  .rs-pc__cta .rs-slot__in { padding: 9px 0; border-radius: 10px; font-size: 12px; font-weight: 700; text-align: center; color: #fff; background: var(--rs-navy); box-shadow: 0 10px 18px -10px rgba(23, 26, 101, 0.9); }

  /* Collection card */
  .rs-col .rs-slot__in { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 5px; height: 54px; }
  .rs-col img { border-radius: 8px; }
  .rs-col__name { margin-top: 8px; font-size: 10.5px; font-weight: 700; color: var(--rs-navy); text-align: left; }

  /* SEO badge */
  .rs-seo { display: flex; align-items: center; gap: 10px; text-align: left; }
  .rs-seo svg { flex: none; rotate: -90deg; }
  .rs-seo__track { fill: none; stroke: var(--rs-lav); stroke-width: 4; }
  .rs-seo__fill { fill: none; stroke: var(--rs-green); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 2; animation: rs-gauge 1s var(--rs-ease) 6.95s both; }
  .rs-seo b { display: block; font-size: 13px; font-weight: 800; color: var(--rs-navy); }
  .rs-seo span { font-size: 10px; color: var(--rs-muted); }

  /* Storefront */
  .rs-sf { display: flex; flex-direction: column; gap: 7px; text-align: left; }
  .rs-sf__nav .rs-slot__in { display: flex; align-items: center; gap: 10px; padding: 7px 9px; border-radius: 9px; font-size: 9px; color: var(--rs-muted); background: #fff; border: 1px solid rgba(23, 26, 101, 0.06); }
  .rs-sf__nav b { margin-right: auto; font-size: 10px; letter-spacing: 0.16em; color: var(--rs-navy); }
  .rs-sf__hero { height: 118px; }
  .rs-sf__hero .rs-slot__in { position: relative; height: 100%; overflow: hidden; border-radius: 11px; }
  .rs-sf__hero-copy { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 5px; padding: 12px; background: linear-gradient(0deg, rgba(23, 26, 101, 0.72), rgba(23, 26, 101, 0) 72%); }
  .rs-sf__hero-copy b { font-size: 15px; font-weight: 800; color: #fff; }
  .rs-sf__hero-copy em { padding: 3px 9px; border-radius: 99px; font-size: 8.5px; font-style: normal; font-weight: 700; color: var(--rs-navy); background: #fff; }
  .rs-sf__cols .rs-slot__in { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .rs-sf__cols span { position: relative; height: 62px; overflow: hidden; border-radius: 9px; }
  .rs-sf__cols em { position: absolute; left: 7px; bottom: 6px; font-size: 9px; font-style: normal; font-weight: 700; color: #fff; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5); }

  /* Mobile preview */
  .rs-phone { position: relative; display: flex; flex-direction: column; gap: 5px; height: 200px; padding: 16px 7px 8px; overflow: hidden; border-radius: 18px; background: #fff; border: 1px solid rgba(23, 26, 101, 0.08); }
  .rs-phone__notch { position: absolute; left: 50%; top: 5px; width: 30px; height: 5px; margin-left: -15px; border-radius: 9px; background: #1b1d4a; }
  .rs-phone__nav { display: flex; align-items: center; justify-content: space-between; font-size: 6.5px; letter-spacing: 0.14em; }
  .rs-phone__nav i { width: 9px; height: 5px; border-top: 1.5px solid var(--rs-navy); border-bottom: 1.5px solid var(--rs-navy); }
  .rs-phone__hero { height: 70px !important; border-radius: 8px; }
  .rs-phone__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; height: 52px; }
  .rs-phone__grid img { border-radius: 6px; }
  .rs-phone__cta { margin-top: auto; padding: 5px 0; border-radius: 6px; font-size: 7px; font-weight: 700; text-align: center; color: #fff; background: var(--rs-navy); }

  /* ---------- Corner badge + assistant ---------- */
  .rs-shopify {
    position: absolute;
    top: 18px;
    right: 20px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px 6px 7px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--rs-navy);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(23, 26, 101, 0.07);
    box-shadow: 0 8px 20px -14px rgba(23, 26, 101, 0.5);
    animation: rs-fade 0.8s ease 3s both;
  }
  .rs-shopify i { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 99px; color: #fff; background: #008060; }
  .rs-assist {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 76px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: max-content;
    margin: 0 auto;
    padding: 7px 9px 7px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(67, 56, 255, 0.14);
    box-shadow: 0 14px 34px -18px rgba(67, 56, 255, 0.6);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    animation: rs-rise 0.7s var(--rs-ease) 0.9s both, rs-hover 5s ease-in-out 1.6s infinite, rs-assist-glow 1.2s ease-out 1.95s both;
  }
  .rs-assist__text { font-size: 12.5px; font-weight: 700; color: var(--rs-navy); }
  .rs-assist__tools { display: flex; gap: 10px; padding-left: 10px; margin-left: 4px; color: #7a7da8; border-left: 1px solid rgba(23, 26, 101, 0.1); }

  /* ---------- Exit: the splash opens into the workspace ---------- */
  .lcp-splash.is-exiting .rs-center { animation: rs-exit-center 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  .lcp-splash.is-exiting .rs-frag { animation: rs-exit-frag 0.75s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  .lcp-splash.is-exiting .rs-frag--store { animation: rs-exit-store 0.85s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
  .lcp-splash.is-exiting .rs-lines, .lcp-splash.is-exiting .rs-ping,
  .lcp-splash.is-exiting .rs-flow,
  .lcp-splash.is-exiting .rs-assist, .lcp-splash.is-exiting .rs-shopify { opacity: 0; transition: opacity 0.3s; }

  /* ---------- Keyframes ---------- */
  @keyframes rs-fade { from { opacity: 0; } }
  @keyframes rs-rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes rs-drift-a { to { transform: translate(90px, 50px); } }
  @keyframes rs-drift-b { to { transform: translate(-80px, 70px); } }
  @keyframes rs-flash { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes rs-scatter { 0% { transform: none; } 35% { transform: translate(var(--dx), var(--dy)); } 100% { transform: translate(calc(var(--dx) * 0.3), calc(var(--dy) * 0.3)); } }
  @keyframes rs-twinkle { 0%, 100% { opacity: 0.12; transform: translateY(0); } 50% { opacity: 0.5; transform: translateY(-9px); } }
  @keyframes rs-camera { 0% { transform: none; } 30% { transform: scale(1.035); } 100% { transform: none; } }
  @keyframes rs-halo { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: none; } }
  @keyframes rs-breathe { 0%, 100% { scale: 1; } 50% { scale: 1.07; } }
  @keyframes rs-gather {
    0% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1.2); }
    35% { opacity: 1; }
    100% { opacity: 0; transform: translate(0, 0) scale(0.3); }
  }
  @keyframes rs-wave { 0% { opacity: 0.9; transform: scale(0.85); } 100% { opacity: 0; transform: scale(3.4); } }
  @keyframes rs-wave-idle { 0% { opacity: 0.4; transform: scale(1); } 100% { opacity: 0; transform: scale(1.9); } }
  @keyframes rs-form { 0% { opacity: 0; scale: 0.82; filter: blur(12px); } 100% { opacity: 1; scale: 1; filter: blur(0); } }
  @keyframes rs-lift { 0% { transform: none; } 35% { transform: translateY(-9px) rotate(-3deg); } 60% { transform: translateY(-6px) rotate(-1deg) scale(1.04); } 100% { transform: none; } }
  @keyframes rs-idle { 0%, 100% { translate: 0 0; } 50% { translate: 0 -5px; } }
  @keyframes rs-disc { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: none; } }
  @keyframes rs-strand { 0% { opacity: 0; transform: scale(0.55) rotate(-20deg); } 100% { opacity: 1; transform: none; } }
  @keyframes rs-mane { 0% { transform: scale(0.94); } 30% { transform: scale(1.03); } 52% { transform: scale(1.12) rotate(4deg); } 100% { transform: none; } }
  @keyframes rs-face { 0% { opacity: 0; transform: translateY(6px) scale(0.9); } 100% { opacity: 1; transform: none; } }
  @keyframes rs-eyes { 0% { opacity: 0; } 18% { opacity: 1; } 65% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes rs-roar { 0% { transform: scaleY(0); } 30%, 62% { transform: scaleY(1); } 100% { transform: scaleY(0); } }
  @keyframes rs-spark { 0% { opacity: 0; transform: scale(0) rotate(-90deg); } 100% { opacity: 1; transform: none; } }
  @keyframes rs-twinkle-spark { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  @keyframes rs-letter { 0% { opacity: 0; transform: translateX(var(--x)) scale(0.9); filter: blur(6px); } 100% { opacity: 1; transform: none; filter: blur(0); } }
  @keyframes rs-sheen { 0% { opacity: 1; background-position: 100% 0; } 85% { opacity: 1; } 100% { opacity: 0; background-position: 0 0; } }
  @keyframes rs-msg { 0% { opacity: 0; transform: translateY(14px); filter: blur(8px); } 100% { opacity: 1; transform: none; filter: blur(0); } }
  @keyframes rs-fill { 0% { width: 0; } 18% { width: 16%; } 40% { width: 38%; } 62% { width: 61%; } 82% { width: 84%; } 100% { width: 100%; } }
  @keyframes rs-glow { 0%, 100% { box-shadow: 0 0 8px rgba(124, 58, 237, 0.45); } 50% { box-shadow: 0 0 16px rgba(124, 58, 237, 0.9); } }
  @keyframes rs-spark-run { 0% { left: -30px; opacity: 0; } 15% { opacity: 1; } 100% { left: 100%; opacity: 0.6; } }
  @keyframes rs-caption { 0% { opacity: 0; transform: translateY(6px); filter: blur(3px); } 18%, 82% { opacity: 1; transform: none; filter: blur(0); } 100% { opacity: 0; transform: translateY(-6px); filter: blur(3px); } }
  @keyframes rs-caption-stay { 0% { opacity: 0; transform: translateY(6px); filter: blur(3px); } 100% { opacity: 1; transform: none; filter: blur(0); } }
  @keyframes rs-draw { 0% { stroke-dashoffset: 1; } 100% { stroke-dashoffset: 0; } }
  /* The head runs from the start of the path to just past its end (1 + the longest tail), so every layer lands together. */
  @keyframes rs-signal { to { stroke-dashoffset: calc((var(--L) - 1.26) * 1px); } }
  @keyframes rs-flow { 0% { offset-distance: 0%; opacity: 0; } 12% { opacity: 0.95; } 86% { opacity: 0.95; } 100% { offset-distance: 100%; opacity: 0; } }
  @keyframes rs-lock { 0% { opacity: 0; transform: scale(1.22); } 14% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes rs-scan { 0% { transform: translateY(-110%); } 100% { transform: translateY(260%); } }
  @keyframes rs-ping { 0% { opacity: 0.9; transform: scale(0.3); } 100% { opacity: 0; transform: scale(3.2); } }
  @keyframes rs-frag-in {
    0% { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(0.45); filter: blur(10px); }
    55% { opacity: 1; transform: translate(calc(var(--fx) * -0.07), calc(var(--fy) * -0.07)) scale(1.02); filter: blur(0); }
    100% { opacity: 1; transform: none; filter: none; }
  }
  @keyframes rs-sway { 0% { rotate: -1.6deg; translate: 0 -5px; } 100% { rotate: 1.6deg; translate: 0 6px; } }
  @keyframes rs-active { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes rs-store-pop { 0% { scale: 1; } 40% { scale: 1.06; } 100% { scale: 1; } }
  @keyframes rs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes rs-type-line { 0% { transform: scaleX(0); } 100% { transform: none; } }
  @keyframes rs-skeleton { 0% { opacity: 1; background-position: 100% 0; } 99.9% { opacity: 1; background-position: 0 0; } 100% { opacity: 0; } }
  @keyframes rs-snap { 0% { opacity: 0; transform: scale(1.12) translateY(6px); filter: blur(6px); } 100% { opacity: 1; transform: none; filter: blur(0); } }
  @keyframes rs-gauge { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 2; } }
  @keyframes rs-hover { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
  @keyframes rs-assist-glow { 0% { box-shadow: 0 14px 34px -18px rgba(67, 56, 255, 0.6); } 30% { box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.18), 0 0 36px rgba(124, 58, 237, 0.55); } 100% { box-shadow: 0 14px 34px -18px rgba(67, 56, 255, 0.6); } }
  @keyframes rs-exit-center { to { opacity: 0; transform: translate(-50%, -50%) scale(0.86); filter: blur(6px); } }
  @keyframes rs-exit-frag { to { opacity: 0; transform: translate(calc(var(--fx) * 0.5), calc(var(--fy) * 0.5)) scale(0.7); filter: blur(6px); } }
  @keyframes rs-exit-store { to { opacity: 0; transform: translate(-180px, -160px) scale(1.35); filter: blur(4px); } }

  /* ---------- Responsive ---------- */
  @media (max-width: 1360px), (max-height: 820px) { .rs-msg__main { font-size: 22px; } .rs-msg__ai { font-size: 16px; } }
  @media (max-width: 1360px) { .lcp-splash { --rs-sw: 0.86; } }
  @media (max-width: 1180px) { .lcp-splash { --rs-sw: 0.74; } }
  @media (max-height: 820px) { .lcp-splash { --rs-sh: 0.84; --lion: 132px; } }
  @media (max-height: 720px) { .lcp-splash { --rs-sh: 0.74; --lion: 112px; } .rs-wordmark { margin-top: 16px; font-size: 34px; } }
  @media (max-height: 620px) { .lcp-splash { --rs-sh: 0.64; --lion: 92px; } .rs-assist { display: none; } }
  @media (max-width: 1000px) { .rs-orbit { display: none; } }
  @media (max-width: 640px) {
    .lcp-splash { --lion: 120px; }
    .rs-wordmark { font-size: 32px; }
    .rs-shopify { top: 12px; right: 12px; font-size: 10.5px; }
    .rs-assist__tools { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lcp-splash *, .lcp-splash *::before, .lcp-splash *::after { animation: none !important; }
    .rs-status__item:first-child { opacity: 1; }
    .rs-status__item--last { opacity: 0; }
    .rs-loader__fill { width: 60%; }
    .rs-chip--ready { opacity: 1; }
  }
`;

import { useEffect, useRef } from "react";

/**
 * Kids Play page used after generation.
 * Same sections as the Play card preview, filled with the selected product.
 */
const FEATURE_ICONS = [
];
const PROMO_IMAGE = "";

const FLOWER = "";

function Ticker({ items }) {
  const row = [...items, ...items];
  return (
    <div className="pk-marquee">
      <div className="pk-marquee-track">
        {row.map((label, index) => (
          <span key={`${label}-${index}`}>{label}<img src={FLOWER} alt="" /></span>
        ))}
      </div>
    </div>
  );
}

function PlaySection({ sectionId, selected, selectable, onSelect, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);
  return (
    <div
      ref={ref}
      className={`pk-section${selected ? " is-selected" : ""}${selectable ? " is-selectable" : ""}`}
      onClick={selectable ? (event) => {
        event.stopPropagation();
        onSelect?.(selected ? null : sectionId);
      } : undefined}
    >
      {children}
    </div>
  );
}

function plain(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function PlayKidsPreview({
  title = "Product",
  subtitle = "",
  images = [],
  priceLabel = "",
  compareLabel = "",
  variants = null,
  bodyImages = null,
  text = {},
  selectedSection = null,
  selectorMode = false,
  onSelect = null,
}) {
  const copy = text && typeof text === "object" ? text : {};
  const photos = (Array.isArray(images) ? images : []).filter((src) => typeof src === "string" && src);
  const pageTitle = plain(title) || "Product";
  const pageSubtitle = plain(subtitle);
  const hero = photos[0] || "";
  const thumbs = photos.slice(1, 4);
  const body = bodyImages && typeof bodyImages === "object" ? bodyImages : {};
  const shot = (key, fallback) => (typeof body[key] === "string" && body[key] ? body[key] : fallback);
  const line = (value, fallback) => plain(value) || fallback;
  const featureLabels = [1, 2, 3].map((n, index) => line(
    copy[`feature_label_${n}`],
    ["Large, canvas pieces", "100% recycled", "Giving back 10%"][index],
  ));
  const features = FEATURE_ICONS.map((icon, index) => ({ icon, title: featureLabels[index] }));
  const variantLabels = Array.isArray(variants)
    ? variants.filter((label) => label && label !== "Default Title")
    : ["Natural", "Rainbow", "Mint"];
  const tickerA = [1, 2, 3].map((n) => plain(copy[`marquee_text_${n}`])).filter(Boolean);
  const tickerB = [1, 2, 3, 4].map((n) => plain(copy[`badge_text_${n}`])).filter(Boolean);
  const pills = [1, 2, 3].map((n, index) => line(copy[`pill_${n}`], ["10% Giving back", "Free Shipping over $100 order", "90 Days free return"][index]));
  const circleCaptions = [1, 2, 3, 4].map((n, index) => line(copy[`circle_${n}`], ["Pieces for the senses", "For anytime, anywhere", "Original die cut", "Easy-to-see"][index]));
  const circleShots = [1, 2, 3, 4].map((n) => shot(
    n < 4 ? `happy_customer_image_${n}` : "product_highlight_4",
    [
    ][n - 1],
  ));
  const storyShots = [1, 2, 3, 4].map((n) => shot(`product_highlight_${n}`, [
  ][n - 1]));
  const igShots = (() => {
    const source = photos.length ? photos : [];
    if (!source.length) {
      return [];
    }
    return [0, 1, 2, 3, 4].map((index) => source[index % source.length]);
  })();
  const reviews = [1, 2, 3, 4].map((n, index) => ({
    title: line(copy[`review_title_${n}`], "Enter Your Text"),
    body: line(copy[`review_body_${n}`], "Enter customer review over here"),
    name: line(copy[`review_name_${n}`], "Reviewer Name"),
  }));

  const faqs = [1, 2, 3].map((n) => ({
    q: plain(copy[`product_question_${n}`] || copy[`faq_question_${n}`]) || ["Description", "Details", "Shipping & return"][n - 1],
    a: plain(copy[`product_question_${n}_answer`] || copy[`faq_answer_${n}`]) || [
      pageSubtitle || pageTitle,
      "Solid wood, rounded edges, water-based color. Wipe clean with a damp cloth.",
      "Free shipping. 90-day returns on unused toys in the original box.",
    ][n - 1],
  }));

  return (
    <div className="play-kids-page">
      <style>{`
        .play-kids-page { position: relative; height: auto; overflow: visible; background: #FFFCF5; color: #6F2424; font-family: Poppins, sans-serif; }
        .pk-section.is-selectable { cursor: pointer; }
        .pk-section.is-selectable:hover { box-shadow: inset 0 0 0 2px rgba(44, 110, 203, 0.45); }
        .pk-section.is-selected { box-shadow: inset 0 0 0 2px #2C6ECB; }
        .play-kids-page h1, .play-kids-page h2, .play-kids-page h3 { font-family: "Caveat Brush", cursive; font-weight: 400; margin: 0; overflow-wrap: anywhere; }
        .play-kids-page img { max-width: 100%; display: block; }
        .pk-wrap { width: min(1100px, calc(100% - 48px)); margin: 0 auto; }
        .pk-hero-band { background-image: url(""); background-position: center center; background-size: cover; background-repeat: no-repeat; padding: 72px 0; overflow-x: clip; max-width: 100%; }
        .pk-hero-card { background: #fff; border: 1px solid #6F2424; border-radius: 20px; padding: 40px 48px; box-sizing: border-box; }
        .pk-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 36px; align-items: center; }
        .pk-hero > * { min-width: 0; }
        .pk-gallery { background: #fff; position: relative; }
        .pk-gallery img.hero { width: 100%; height: auto; max-height: 420px; object-fit: contain; border-radius: 20px; background: #fff; }
        .pk-badge { position: absolute; top: 18px; left: 18px; width: 121px; height: 121px; display: grid; place-items: center; text-align: center; color: #fff; background-image: url(""); background-position: center; background-size: cover; background-repeat: no-repeat; font-family: "Caveat Brush", cursive; font-size: 28px; line-height: 0.95; transform: rotate(-21deg); }
        .pk-thumbs { display: flex; gap: 10px; margin-top: 12px; min-width: 0; max-width: 100%; }
        .pk-thumbs img { flex: 1 1 0; min-width: 0; width: 100%; max-width: 72px; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 12px; border: 2px solid #fff; }
        .pk-kicker { letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; font-weight: 600; margin: 0 0 8px; }
        .pk-hero h1 { font-size: 48px; line-height: 1.05; }
        .pk-price { display: flex; align-items: baseline; gap: 12px; margin: 16px 0; }
        .pk-price strong { font-size: 28px; }
        .pk-price s { color: #b08989; font-size: 18px; }
        .pk-variants { display: flex; gap: 8px; margin: 8px 0 18px; flex-wrap: wrap; }
        .pk-variants span { border: 1.5px solid #6F2424; border-radius: 999px; padding: 8px 14px; font-size: 13px; }
        .pk-variants span.on { background: #6F2424; color: #fff; }
        .pk-buy { display: flex; gap: 10px; align-items: center; min-width: 0; max-width: 100%; }
        .pk-qty { display: flex; align-items: center; flex: 0 0 auto; border: 1.5px solid #6F2424; border-radius: 999px; overflow: hidden; }
        .pk-qty span { width: 42px; height: 52px; display: grid; place-items: center; }
        .pk-atc { flex: 1 1 auto; min-width: 0; max-width: 100%; height: 52px; border: 0; border-radius: 999px; background: #6F2424; color: #fff; font: 600 16px Poppins, sans-serif; padding: 0 16px; }
        .pk-marquee { width: 100%; background: #FFC2D4; overflow: hidden; border-top: 1px solid #6F2424; border-bottom: 1px solid #6F2424; }
        .pk-marquee-track { display: flex; align-items: center; width: max-content; animation: pk-ticker 22s linear infinite; }
        .pk-marquee-track span { display: inline-flex; align-items: center; gap: 16px; font-family: "Caveat Brush", cursive; font-size: 28px; line-height: 1; color: #6F2424; padding: 10px 16px; white-space: nowrap; }
        .pk-marquee-track img { width: 22px; height: 22px; flex: none; }
        @keyframes pk-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pk-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; padding: 48px 0; text-align: center; }
        .pk-features img { width: 48px; height: 48px; object-fit: contain; margin: 0 auto 12px; }
        .pk-features h2 { font-size: 32px; line-height: 1; }
        .pk-features p { margin: 8px 0 0; font-size: 14px; line-height: 1.5; }
        .pk-promo { background: #E0F4E0; }
        .pk-promo .pk-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; padding: 48px 0; }
        .pk-promo h2 { font-size: 44px; line-height: 1.05; }
        .pk-code { margin-top: 18px; display: inline-block; background: #fff; border: 2px dashed #3F9D3E; color: #3F9D3E; border-radius: 999px; padding: 12px 22px; font-weight: 700; letter-spacing: 0.08em; }
        .pk-promo img { width: 100%; height: auto; object-fit: contain; border-radius: 24px; }
        .pk-story { padding: 56px 0 28px; text-align: center; }
        .pk-mix { font-family: "Caveat Brush", cursive; font-size: 48px; line-height: 1.35; color: #6F2424; }
        .pk-mix img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle; margin: 0 8px; }
        .pk-pills { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .pk-pills span { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #6F2424; border-radius: 999px; padding: 8px 16px; font-size: 15px; font-weight: 600; }
        .pk-pills i { width: 22px; height: 22px; border-radius: 50%; background: #FFD74F; color: #6F2424; display: grid; place-items: center; font-style: normal; font-size: 13px; }
        .pk-faq { background: #FFF1C0; padding: 64px 0 72px; }
        .pk-faq h2 { font-size: 56px; line-height: 1; text-align: center; margin-bottom: 28px; }
        .pk-designed { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .pk-arch { position: relative; }
        .pk-arch img { width: 100%; height: auto; display: block; }
        .pk-recycle { position: absolute; top: 18px; left: 6px; width: 150px; height: 150px; display: grid; place-items: center; text-align: center; color: #fff; background: url("") center / cover no-repeat; font-family: "Caveat Brush", cursive; font-size: 30px; line-height: 0.95; transform: rotate(-15deg); }
        .pk-faq details { background: #fff; border: 1px solid #6F2424; border-radius: 20px; margin: 0 0 16px; padding: 6px 20px; }
        .pk-faq summary { cursor: pointer; font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 32px; list-style: none; display: flex; justify-content: space-between; align-items: center; padding: 14px 0; }
        .pk-faq summary::-webkit-details-marker { display: none; }
        .pk-faq summary:after { content: "⌄"; font-family: Poppins, sans-serif; font-size: 18px; }
        .pk-faq details[open] summary { border-bottom: 1px solid #6F2424; }
        .pk-faq details[open] summary:after { content: "⌃"; }
        .pk-faq details p { margin: 14px 0; color: rgba(111, 36, 36, 0.8); font-size: 15px; line-height: 1.6; }
        .pk-senses { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; text-align: center; padding: 36px 0 56px; }
        .pk-senses img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; margin: 0 auto 12px; }
        .pk-senses h3 { font-size: 24px; }
        .pk-rows { display: grid; gap: 28px; padding-bottom: 48px; }
        .pk-row { display: grid; grid-template-columns: 180px 1fr; gap: 20px; align-items: center; }
        .pk-row img { width: 180px; height: auto; max-height: 160px; object-fit: contain; border-radius: 18px; background: #fff; }
        .pk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-bottom: 48px; }
        .pk-grid img { width: 100%; height: auto; aspect-ratio: 1; object-fit: contain; border-radius: 18px; background: #fff; }
        .pk-reviews { background: #FFFCF5 url("") center top / cover no-repeat; padding: 100px 0 70px; }
        .pk-reviews h2 { text-align: center; font-size: 56px; line-height: 1; }
        .pk-cards { display: flex; gap: 16px; margin-top: 28px; overflow: hidden; }
        .pk-card { flex: 0 0 260px; background: #fff; border: 1px solid #6F2424; border-radius: 20px; padding: 28px 22px 22px; text-align: left; }
        .pk-card h3 { font-size: 28px; margin: 8px 0; }
        .pk-card p { margin: 0 0 18px; font-size: 14px; line-height: 1.5; }
        .pk-card b { font-size: 13px; letter-spacing: 0.04em; }
        .pk-stars { color: #E0A106; letter-spacing: 2px; font-size: 14px; }
        .pk-ig { background: #6F2424; color: #fff; padding: 36px 0 32px; }
        .pk-ig-head { margin-bottom: 18px; }
        .pk-ig h2 { font-size: 48px; color: #fff; line-height: 1; }
        .pk-ig-row { display: flex; gap: 12px; align-items: stretch; }
        .pk-ig-cell { flex: 1 1 0; min-width: 0; border-radius: 16px; overflow: hidden; background: #fff; }
        .pk-ig-row img { position: static; width: 100%; height: auto; aspect-ratio: 1 / 1; max-width: 100%; object-fit: cover; display: block; }
        @media (max-width: 800px) {
          .pk-hero, .pk-promo .pk-wrap, .pk-features, .pk-senses, .pk-designed { grid-template-columns: 1fr; }
          .pk-ig-row { flex-wrap: wrap; }
          .pk-ig-cell { flex: 1 1 calc(50% - 6px); }
          .pk-mix { font-size: 32px; }
          .pk-hero h1, .pk-promo h2, .pk-story h2, .pk-faq h2, .pk-reviews h2 { font-size: 42px; }
          .pk-row { grid-template-columns: 1fr; }
          .pk-hero-band { padding: 28px 0; }
          .pk-wrap.pk-hero-card { width: calc(100% - 24px); padding: 16px 12px; }
          .pk-gallery img.hero { max-height: 280px; }
          .pk-badge { width: 92px; height: 92px; top: 10px; left: 10px; font-size: 22px; }
        }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Poppins:wght@400;500;600;700&display=swap" />

      <PlaySection sectionId="play_hero" selected={selectedSection === "play_hero"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-hero-band">
      <div className="pk-wrap pk-hero-card">
      <div className="pk-hero">
        <div>
          <div className="pk-gallery">
            <span className="pk-badge">Save<br />50%</span>
            {hero ? <img className="hero" src={hero} alt={pageTitle} /> : null}
          </div>
          {thumbs.length ? (
            <div className="pk-thumbs">
              {thumbs.map((src) => <img key={src} src={src} alt="" />)}
            </div>
          ) : null}
        </div>
        <div>
          <p className="pk-kicker">Kids toys</p>
          <h1>{pageTitle}</h1>
          {(priceLabel || compareLabel) ? (
            <div className="pk-price">
              {priceLabel ? <strong>{priceLabel}</strong> : null}
              {compareLabel ? <s>{compareLabel}</s> : null}
            </div>
          ) : null}
          {variantLabels.length ? (
            <div className="pk-variants">
              {variantLabels.map((label, index) => (
                <span key={label} className={index === 0 ? "on" : ""}>{label}</span>
              ))}
            </div>
          ) : null}
          <div className="pk-buy">
            <div className="pk-qty"><span>−</span><span>1</span><span>+</span></div>
            <button className="pk-atc" type="button">Add to cart</button>
          </div>
        </div>
      </div>
      </div>
      </section>
      </PlaySection>

      <PlaySection sectionId="play_marquee" selected={selectedSection === "play_marquee"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <Ticker items={tickerA.length ? tickerA : ["Sale 50% Off", "Giving back 10%", "Black Friday"]} />
      </PlaySection>

      <PlaySection sectionId="play_features" selected={selectedSection === "play_features"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-wrap pk-features">
        {features.map((feature) => (
          <div key={feature.title}>
            <img src={feature.icon} alt="" />
            <h2>{feature.title}</h2>
          </div>
        ))}
      </section>
      </PlaySection>

      <PlaySection sectionId="play_promo" selected={selectedSection === "play_promo"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-promo">
        <div className="pk-wrap">
          <div>
            <h2>{plain(copy.pillow_banner_heading) || "A brighter way to play, half off this week."}</h2>
            <p>{plain(copy.pillow_banner_subheading) || "Use the code at checkout. It stacks with the sale price."}</p>
            <div className="pk-code">{line(copy.promo_code, "BLACKFRIDAY")}</div>
          </div>
          <img src={shot("feature_image", PROMO_IMAGE)} alt="" />
        </div>
      </section>
      </PlaySection>

      <PlaySection sectionId="play_story" selected={selectedSection === "play_story"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-story">
        <div className="pk-wrap pk-mix">
          We created <img src={storyShots[0]} alt="" /> original die cut <img src={storyShots[1]} alt="" /><br />
          <img src={storyShots[2]} alt="" /> to make pieces that are <img src={storyShots[3]} alt="" /> easy-to-see
        </div>
        <div className="pk-wrap pk-pills">
          {pills.map((label) => <span key={label}><i>✓</i> {label}</span>)}
        </div>
      </section>
      </PlaySection>

      <PlaySection sectionId="play_designed" selected={selectedSection === "play_designed"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-faq">
        <div className="pk-wrap">
          <h2>Thoughtfully Designed</h2>
          <div className="pk-designed">
            <div className="pk-arch">
              <span className="pk-recycle">100%<br />Recycled</span>
              <img src={shot("problem_solving_image", "")} alt="" />
            </div>
            <div>
              {faqs.map((item, index) => (
                <details key={item.q} open={index === 1}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
      </PlaySection>

      <PlaySection sectionId="play_badges" selected={selectedSection === "play_badges"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <Ticker items={tickerB.length ? tickerB : ["Kid Safe", "Free Shipping", "90 Days Returns", "Gift Favorite"]} />
      </PlaySection>

      <PlaySection sectionId="play_circles" selected={selectedSection === "play_circles"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-wrap pk-senses">
        {circleShots.map((src, index) => (
          <div key={circleCaptions[index]}>
            <img src={src} alt="" />
            <h3>{circleCaptions[index]}</h3>
          </div>
        ))}
      </section>
      </PlaySection>

      <PlaySection sectionId="play_reviews" selected={selectedSection === "play_reviews"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-reviews">
        <div className="pk-wrap">
          <h2>Lovely Customers</h2>
          <div className="pk-cards">
            {reviews.map((review) => (
              <div className="pk-card" key={review.name + review.title}>
                <div className="pk-stars">★★★★★</div>
                <h3>{review.title}</h3>
                <p>{review.body}</p>
                <b>{review.name}</b>
              </div>
            ))}
          </div>
        </div>
      </section>
      </PlaySection>

      <PlaySection sectionId="play_instagram" selected={selectedSection === "play_instagram"} selectable={Boolean(selectorMode)} onSelect={onSelect}>
      <section className="pk-ig">
        <div className="pk-wrap">
          <div className="pk-ig-head"><h2>Instagram</h2></div>
          <div className="pk-ig-row">
            {igShots.map((src, index) => (
              <div className="pk-ig-cell" key={`${src}-${index}`}>
                <img src={src} alt="" width="672" height="672" />
              </div>
            ))}
          </div>
        </div>
      </section>
      </PlaySection>
    </div>
  );
}

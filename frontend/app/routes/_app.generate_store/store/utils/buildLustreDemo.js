/**
 * Lustre demo: text, pictures and catalog for the in-app preview and template card. Real generation
 * replaces the copy and pictures, and the live storefront uses the merchant's own menus, products
 * and articles, so everything named `demo_*` exists only here. Pictures come from
 * backend/scripts/generate_lustre_demo_images.py.
 */

const A = "/lustre-assets";

const LUSTRE_TEXT = {
  store_name: "Lustre",

  marquee_text_1: "Up to 20% off this season",
  marquee_text_2: "Free shipping and returns",
  marquee_text_3: "30 day money back promise",
  marquee_text_4: "Gift wrapping on every order",

  hero_kicker_1: "Find your signature sparkle",
  banner_heading_1: "Radiant Necklaces And Earrings For Every Occasion",
  banner_text_1: "Refined pieces made for your everyday moments",
  hero_kicker_2: "The layered edit",
  banner_heading_2: "Fine Gold Chains Made For Stacking Together",
  banner_text_2: "Mix, match and wear them your own way",
  hero_kicker_3: "New statement pieces",
  banner_heading_3: "Bold Emerald Collars With A Timeless Finish",
  banner_text_3: "Color and craft for your biggest nights",

  about_kicker: "Our story",
  about_heading: "Graceful Jewelry For People Who Love Details",
  about_text:
    "We choose every piece for its shape, its finish and how it feels to wear. Jewelry should lift an ordinary day, so we keep our range considered, comfortable and easy to love.",

  categories_heading: "Shop By Categories",
  categories_text: "Browse our most loved styles, gathered by what you wear.",
  top_product_punchline_1: "Earrings",
  collection_1: "earrings",
  collection_count_1: 4,
  top_product_punchline_2: "Necklace",
  collection_2: "necklace",
  collection_count_2: 6,
  top_product_punchline_3: "Jewellery Set",
  collection_3: "jewellery-set",
  collection_count_3: 8,
  top_product_punchline_4: "Pendant",
  collection_4: "pendant",
  collection_count_4: 7,
  top_product_punchline_5: "Rings",
  collection_5: "rings",
  collection_count_5: 7,
  top_product_punchline_6: "Bracelets",
  collection_6: "bracelets",
  collection_count_6: 3,

  card_title_1: "Sculpted Gold Hoops",
  card_title_2: "Pearl Link Necklace",
  card_title_3: "Slim Diamond Band",

  trending_heading: "Trending Products",
  trending_text: "The pieces our customers are reaching for right now.",

  split_heading: "Wear Your Joy Every Day",
  split_text:
    "A little shine changes how a day feels. Choose pieces you can reach for without a second thought, from the morning coffee to the late dinner.",

  service_1_title: "Worldwide Shipping",
  service_1_text: "On all orders over $100",
  service_2_title: "Money Back Promise",
  service_2_text: "Guaranteed within 30 days",
  service_3_title: "Offers And Discounts",
  service_3_text: "New savings every week",
  service_4_title: "Friendly Support",
  service_4_text: "Contact us anytime",

  promo_kicker_1: "Flat 30% off",
  promo_heading_1: "Layered Bridal Gold Sets",
  promo_kicker_2: "Flat 20% off",
  promo_heading_2: "Limited Drop Earrings",

  featured_heading: "Featured Products",
  featured_text: "Hand-picked favorites from our latest collection.",

  testimonials_heading: "What Our Clients Say",
  testimonials_text: "Kind words from the people who wear our pieces.",
  customer_name_1: "Maya Ellison",
  customer_role_1: "Interior Designer",
  customer_review_1:
    "The earrings are even prettier in person. They arrived beautifully packed, and I have worn them nearly every day since.",
  customer_name_2: "Noor Valencia",
  customer_role_2: "Studio Founder",
  customer_review_2:
    "I bought a necklace for my sister and went back for one of my own. The finish is lovely and the service was so helpful.",

  blog_heading: "Our Latest Blog",
  blog_text: "Styling ideas and care tips from our team.",

  store_address: "12 Sample Street\nYour City, Your Country",
  store_email: "hello@example.com",
  store_phone: "+00 000 000 000",
  social_facebook: "#",
  social_instagram: "#",
  social_youtube: "#",
  social_x: "#",
  social_pinterest: "#",
  footer_newsletter_text: "Join our newsletter for new arrivals, styling notes and special offers.",

  label_read_more: "Read more",
  label_options: "Options",
  label_items: "Items",
  label_subscribe: "Subscribe",
  footer_store_heading: "Store Information",
  footer_services_heading: "Services",
  footer_links_heading: "Quick Links",
  footer_newsletter_heading: "Our Newsletter",
};

const LUSTRE_IMAGES = {
  banner_image_1: `${A}/hero-1.jpg`,
  banner_image_2: `${A}/hero-2.jpg`,
  banner_image_3: `${A}/hero-3.jpg`,
  about_image_1: `${A}/about-1.jpg`,
  about_image_2: `${A}/about-2.jpg`,
  product_impact_image_1: `${A}/cat-1.jpg`,
  product_impact_image_2: `${A}/cat-2.jpg`,
  product_impact_image_3: `${A}/cat-3.jpg`,
  product_impact_image_4: `${A}/cat-4.jpg`,
  product_impact_image_5: `${A}/cat-5.jpg`,
  product_impact_image_6: `${A}/cat-6.jpg`,
  feature_image_1: `${A}/card-1.jpg`,
  feature_image_2: `${A}/card-2.jpg`,
  feature_image_3: `${A}/card-3.jpg`,
  split_image: `${A}/split.jpg`,
  promo_image_1: `${A}/promo-1.jpg`,
  promo_image_2: `${A}/promo-2.jpg`,
  customer_avatar_1: `${A}/avatar-1.jpg`,
  customer_avatar_2: `${A}/avatar-2.jpg`,
  brand_logo_1: `${A}/brand-1.svg`,
  brand_logo_2: `${A}/brand-2.svg`,
  brand_logo_3: `${A}/brand-3.svg`,
  brand_logo_4: `${A}/brand-4.svg`,
  brand_logo_5: `${A}/brand-5.svg`,
};

// title, price, compare-at price, has variants
const PRODUCTS = [
  ["Halo Solitaire Split Shank Gold Ring", 18000, null, true],
  ["Turquoise Flower Diamond Drop Earrings", 37000, 39000, false],
  ["Interlocked Hearts Diamond Pendant", 25000, null, false],
  ["Violet Baguette Gold Diamond Earrings", 10000, null, false],
  ["Rose Gold Leaf Pear Diamond Earrings", 25000, 29000, true],
  ["Swirl Crossover Diamond Gold Ring", 10000, null, true],
  ["Ruby Teardrop Yellow Gold Bangle", 25000, 29000, true],
  ["Violet Bezel Stone Chain Detail Ring", 9000, 9700, true],
];

const DEMO_PRODUCTS = PRODUCTS.map(([title, price, compareAt, hasVariants], i) => {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `lustre-${i + 1}`,
    title,
    handle,
    url: `/products/${handle}`,
    price,
    ...(compareAt ? { compare_at_price: compareAt } : {}),
    available: true,
    has_only_default_variant: !hasVariants,
    featured_image: `${A}/product-${i + 1}.jpg`,
    selected_or_first_available_variant: { id: `lustre-variant-${i + 1}` },
  };
});

const DEMO_ARTICLES = [
  {
    title: "From Runway Looks To Your Everyday Jewelry Box",
    image: `${A}/blog-1.jpg`,
    excerpt_or_content: "A few simple ways to borrow the season's boldest ideas, and wear them comfortably with the clothes you already own every week.",
  },
  {
    title: "Five Earring Shapes That Flatter Every Occasion",
    image: `${A}/blog-2.jpg`,
    excerpt_or_content: "From tiny studs to sweeping drops, here is how to pick earrings that suit your outfit, your hair and the room you will be in.",
  },
  {
    title: "How To Care For Your Gold And Diamond Pieces",
    image: `${A}/blog-3.jpg`,
    excerpt_or_content: "Gentle cleaning and sensible storage keep fine jewelry bright for years. These small habits take a minute and make a real difference.",
  },
].map((a, i) => ({ ...a, url: `/blogs/news/post-${i + 1}`, published_at: `2026-0${i + 7}-17` }));

const link = (title, url = "#", links) => ({ title, url, ...(links ? { links } : {}) });

const DEMO_NAV = [
  link("Home", "/"),
  link("Shop", "/collections/all", [link("Earrings", "/collections/earrings"), link("Necklace", "/collections/necklace"), link("Rings", "/collections/rings")]),
  link("Collections", "/collections"),
  link("Bracelets", "/collections/bracelets", [link("Charm Bracelets", "/collections/charm-bracelet"), link("Tennis Bracelets", "/collections/tennis-bracelets")]),
  link("Contact", "/pages/contact"),
  link("Blogs", "/blogs/news"),
];

const value = (label, count, param) => ({ label, value: label, count, param_name: param, active: false });

/** Same shape as Shopify's `collection.filters`. */
const DEMO_FILTERS = [
  { type: "list", label: "Availability", values: [value("In stock", 8, "filter.v.availability"), value("Out of stock", 1, "filter.v.availability")] },
  { type: "price_range", label: "Price", range_max: 37000, min_value: { param_name: "filter.v.price.gte" }, max_value: { param_name: "filter.v.price.lte" } },
  {
    type: "list",
    presentation: "swatch",
    label: "Color",
    values: [
      { ...value("Silver", 2, "filter.v.option.color"), swatch: { color: "#9b9b9b" } },
      { ...value("Rose", 2, "filter.v.option.color"), swatch: { color: "#e8927c" } },
      { ...value("Gold", 4, "filter.v.option.color"), swatch: { color: "#ffd700" } },
    ],
  },
  { type: "list", label: "Carat", values: ["18KT", "22KT", "24KT"].map((v) => value(v, 2, "filter.v.option.carat")) },
  { type: "list", label: "Product Type", values: [value("Earrings", 3, "filter.p.product_type"), value("Pendant", 1, "filter.p.product_type"), value("Rings", 4, "filter.p.product_type")] },
];

const DEMO_COLLECTION = {
  title: "Rings",
  url: "/collections/rings",
  products: DEMO_PRODUCTS,
  products_count: DEMO_PRODUCTS.length,
  filters: DEMO_FILTERS,
  sort_by: "best-selling",
  sort_options: [
    { value: "best-selling", name: "Best selling" },
    { value: "title-ascending", name: "Alphabetically, A-Z" },
    { value: "price-ascending", name: "Price, low to high" },
    { value: "price-descending", name: "Price, high to low" },
  ],
};

const COLLECTION_NAMES = [
  "Ankle Bracelets", "Anklets", "Antique Bangle", "Beaded Anklet", "Beaded Bracelets", "Bracelets",
  "Braided Anklet", "Charm Bracelet", "Charmed Anklet", "Charms", "Cocktail Ring", "Drop Earrings",
  "Diamond Ring", "Earrings", "Featured Products", "Gold Rings", "Hoop Earrings", "Jewellery Set",
  "Layered Anklets", "Necklace", "Pearl Earrings", "Pendant", "Rings", "Rose Gold Ring",
  "Silver Rings", "Statement Earrings", "Stud Earrings", "Tennis Bracelets", "Trending Products", "Wedding Rings",
];

const DEMO_COLLECTION_LIST = COLLECTION_NAMES.map((title, i) => ({
  title,
  handle: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  url: `/collections/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  products_count: 3 + ((i * 5) % 7),
  featured_image: `${A}/cat-${(i % 6) + 1}.jpg`,
}));

const link_list = (items) => items.map(([title, url]) => link(title, url));

const payBadge = (label) =>
  `<span style="display:inline-grid;place-items:center;width:38px;height:24px;border:1px solid #d9dfe0;border-radius:3px;background:#fff;color:#1f2a44;font:700 8px/1 sans-serif">${label}</span>`;

/**
 * Menus and payment badges for any Lustre preview: these come from the merchant's Shopify settings
 * on the live store, which a preview cannot read.
 */
export const LUSTRE_PREVIEW_CHROME = {
  demo_nav: DEMO_NAV,
  demo_footer_links: link_list([
    ["About Us", "/pages/about"],
    ["FAQ", "/pages/faq"],
    ["Contact Us", "/pages/contact"],
    ["Size Guide", "/pages/size-guide"],
    ["Shipping & Returns", "/pages/shipping"],
    ["Delivery Information", "/pages/delivery"],
  ]),
  demo_policies: link_list([
    ["Privacy Policy", "/policies/privacy-policy"],
    ["Shipping Policy", "/policies/shipping-policy"],
    ["Terms of Service", "/policies/terms-of-service"],
  ]),
  demo_locale: "USD $ · English",
  demo_payments: ["VISA", "MC", "AMEX", "PAY", "DC", "DISC"].map(payBadge).join(""),
};

/**
 * Makes the sample preview behave like a store. The preview's navigation lock already stops every
 * link and form, so this only decides what each click means: ask the host for a page it can show,
 * or explain that the page exists on the live store.
 */
const DEMO_RUNTIME = `<script>
(function () {
  var KEY = "lx-preview-cart", timer;
  var PAGES = /^\\/$|^\\/collections(\\/[^/]+)?$|^\\/products\\/[^/]+$|^\\/pages\\/(about|contact|faq)$/;
  function cartCount() { try { return Number(sessionStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
  function paintCart() { document.querySelectorAll("[data-lx-cart-count]").forEach(function (el) { el.textContent = cartCount(); }); }
  function toast(message) {
    var el = document.getElementById("lx-preview-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "lx-preview-toast";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);padding:12px 20px;background:#111;color:#fff;font:500 14px/1.4 'DM Sans',sans-serif;box-shadow:0 8px 24px rgb(0 0 0 / .25)";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(function () { el.hidden = true; }, 2600);
  }
  // The app's iframe sandbox has no allow-forms, so a submit event never fires: read the button click.
  function onSubmitClick(form) {
    if (form.querySelector('[name="contact[email]"]')) {
      if (!form.reportValidity()) return;
      form.reset();
      toast("Thanks for subscribing.");
    } else if (form.querySelector('[name="id"]')) {
      try { sessionStorage.setItem(KEY, String(cartCount() + 1)); } catch (e) {}
      paintCart();
      toast("Added to cart.");
    }
  }
  document.addEventListener("click", function (event) {
    if (!event.target.closest) return;
    var button = event.target.closest('button[type="submit"]');
    if (button && button.form) { onSubmitClick(button.form); return; }
    var a = event.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href === "" || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
    if (PAGES.test(href)) window.parent.postMessage({ type: "LUSTRE_PREVIEW_NAVIGATE", href: href }, "*");
    else toast("This page opens on your live store.");
  });
  document.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches("[data-lx-autosubmit]")) toast("Filters and sorting work on your live store.");
  });
  window.addEventListener("storage", paintCart);
  paintCart();
})();
</script>`;

const titleFromHandle = (handle) =>
  handle === "all"
    ? "All Products"
    : DEMO_COLLECTION_LIST.find((c) => c.handle === handle)?.title ||
      handle.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** The demo collection for a handle: products whose title fits it, or all of them. */
function demoCollection(handle = "rings") {
  const keyword = handle.split("-").pop().replace(/s$/, "");
  const matching = DEMO_PRODUCTS.filter((p) =>
    p.title.toLowerCase().split(" ").some((word) => word === keyword || word === `${keyword}s`),
  );
  const products = matching.length > 0 ? matching : DEMO_PRODUCTS;
  return {
    ...DEMO_COLLECTION,
    title: titleFromHandle(handle),
    url: `/collections/${handle}`,
    products,
    products_count: products.length,
  };
}

/** Store-level home data for the Lustre template demo and preview. */
export function buildLustreHomeData(collectionHandle) {
  return {
    text: { ...LUSTRE_TEXT },
    images: { ...LUSTRE_IMAGES },
    demo_products: DEMO_PRODUCTS,
    demo_articles: DEMO_ARTICLES,
    demo_collection: demoCollection(collectionHandle),
    demo_collection_list: DEMO_COLLECTION_LIST,
    demo_runtime: DEMO_RUNTIME,
  };
}

/** One demo product in the dashboard shape the product page preview reads; the first by default. */
export function buildLustreDemoProduct(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  const money = (cents) => (cents / 100).toFixed(2);
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: "A refined piece with a polished finish, made to be worn every day and treasured for years.",
    featuredImage: { url: p.featured_image, altText: p.title },
    images: { edges: [{ node: { url: p.featured_image, altText: p.title } }] },
    variants: {
      edges: [
        {
          node: {
            id: p.selected_or_first_available_variant.id,
            price: money(p.price),
            ...(p.compare_at_price ? { compareAtPrice: money(p.compare_at_price) } : {}),
          },
        },
      ],
    },
  };
}

/**
 * Where a link inside the sample preview goes. Returns the home view, a product, or an inner page
 * shown in place of the home view; null for a page the preview does not have.
 */
export function resolveLustrePreviewLink(href) {
  const path = String(href || "");
  if (path === "/") return { view: "Home" };
  if (path === "/collections") return { pageType: "list-collections" };
  const collection = /^\/collections\/([^/]+)$/.exec(path);
  if (collection) return { pageType: "collection", handle: collection[1] };
  const product = /^\/products\/([^/]+)$/.exec(path);
  if (product) return { view: "Product", handle: product[1] };
  const page = { "/pages/about": "about-page", "/pages/contact": "contact-page", "/pages/faq": "faq-page" }[path];
  return page ? { pageType: page } : null;
}

/** Product cards for the Lustre demo, in the dashboard product shape the preview maps from. */
export function buildLustreDemoGridProducts() {
  return DEMO_PRODUCTS.slice(0, 3).map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.title,
    featuredImage: { url: p.featured_image, altText: p.title },
    images: { edges: [{ node: { url: p.featured_image, altText: p.title } }] },
    variants: { edges: [{ node: { id: p.selected_or_first_available_variant.id, price: (p.price / 100).toFixed(2) } }] },
  }));
}

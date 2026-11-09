/**
 * Velour demo: text, pictures and catalog for the in-app preview and template card. Real generation
 * replaces the copy and pictures, and the live storefront uses the merchant's own menus, products
 * and articles, so everything named `demo_*` exists only here. Pictures come from
 * backend/scripts/generate_velour_demo_images.py.
 */

const A = "/velour-assets";

const VELOUR_TEXT = {
  store_name: "Velour",

  ticker_text_1: "New season styles just landed",
  ticker_text_2: "Secure checkout on every order",
  ticker_text_3: "Packed with care",

  hero_kicker_1: "The new season edit",
  banner_heading_1: "Transform Your Wardrobe With Tailored Layers",
  banner_text_1: "Soft structure and easy shapes, cut for every day and made to outlast the season.",
  hero_kicker_2: "Where comfort meets craft",
  banner_heading_2: "Discover Our Relaxed Linen Collection Today",
  banner_text_2: "Breathable fabrics and clean lines that move with you from morning to evening.",
  hero_kicker_3: "Made to be worn often",
  banner_heading_3: "Knitwear That Feels As Good As It Looks",
  banner_text_3: "Rich textures and warm tones, ready to layer over everything you already love.",

  policy_1_title: "Free Shipping",
  policy_1_text: "Enjoy the convenience of free shipping on all orders over $50",
  policy_2_title: "Buy Now. Pay Later",
  policy_2_text: "Shop now, pay later and split your favorite pieces into installments",
  policy_3_title: "Easy Exchanges",
  policy_3_text: "Wrong size? Swap it quickly and find the fit that suits you",
  policy_4_title: "Secure Payments",
  policy_4_text: "Shop confidently with secure payments that protect your information",

  gallery_title_1: "Dresses",
  collection_1: "dresses",
  gallery_title_2: "Outerwear",
  collection_2: "outerwear",
  gallery_title_3: "Knitwear",
  collection_3: "knitwear",
  gallery_title_4: "Denim",
  collection_4: "denim",

  deal_kicker: "Special deals",
  deal_heading: "Seasonal Favorites Are Waiting For You",
  deal_text: "Take a look through this season's most loved styles.",

  showcase_kicker: "Collection",
  showcase_heading: "Discover The Looks In Our Gallery",
  showcase_title_1: "Dresses",
  showcase_text_1: "Explore fluid silhouettes and easy shapes, designed to carry you from a slow morning to a late dinner.",
  showcase_title_2: "Outerwear",
  showcase_text_2: "Considered coats and jackets in rich wools, cut to layer easily over everything in your wardrobe.",
  showcase_title_3: "Knitwear",
  showcase_text_3: "Soft, substantial knits with real texture, made to be pulled on again and again through the colder months.",
  showcase_title_4: "Tailoring",
  showcase_text_4: "Sharp pleats and clean lines that make getting dressed simple, whether the day is formal or not.",

  arrivals_kicker: "Our products",
  arrivals_heading: "New Arrivals",

  statement_kicker: "The perfect wardrobe upgrade",
  statement_heading: "Revamp Your Outfit With Statement Outerwear",
  statement_text: "One well cut coat changes everything underneath it. Find the piece you will reach for all season.",

  lookbook_kicker: "Trending now",
  lookbook_heading: "Styles You'll Love",

  testimonials_kicker: "Testimonials",
  testimonials_heading: "Our Customers Reviews",
  customer_name_1: "Maya Ellison",
  customer_role_1: "Sample review",
  customer_review_1: "I absolutely love my new coat. The fabric feels wonderful, and it works just as well with jeans as it does with a dress.",
  customer_name_2: "Noor Valencia",
  customer_role_2: "Sample review",
  customer_review_2: "The linen shirt is even nicer in person. It is comfortable all day long and I have had so many compliments on it.",
  customer_name_3: "Theo Marlow",
  customer_role_3: "Sample review",
  customer_review_3: "Shopping here has been easy from start to finish. The selection is lovely and the sizing guide helped me get it right.",

  story_kicker: "Newest arrivals this year",
  story_heading_1: "Dress Up With Our Exclusive Pieces",
  story_text_1: "Slip into our latest dresses, made to make you feel your best. Each piece pairs soft fabrics with a flattering cut, perfect for any occasion on your calendar this season.",
  story_heading_2: "Explore Fresh Styles And Trends!",
  story_text_2: "Explore our latest collection of fresh styles for the season. From relaxed linen separates to elegant essentials, find the pieces that refresh your wardrobe and your look.",
  story_heading_3: "Elevate Your Style With Everyday Layers",
  story_text_3: "Build a wardrobe that works harder for you. Discover outerwear and tailoring in versatile tones, cut to combine easily with the clothes you already own and love.",

  blog_kicker: "Our blog",
  blog_heading: "From Our Journal",

  faq_heading: "Frequently Asked Questions",
  faq_q_1: "How do I find the right size?",
  faq_a_1: "Every product page lists the available sizes and notes on the fit. If you are between two sizes, send us a message and we will gladly help you choose.",
  faq_q_2: "How should I care for my clothes?",
  faq_a_2: "Follow the care label inside each garment. Wool and silk prefer a gentle wash, and most pieces last longer when they are air dried away from direct sun.",
  faq_q_3: "How can I contact customer service?",
  faq_a_3: "You can reach our team through the contact page. Tell us your order number if you have one and we will get back to you as soon as we can.",
  faq_q_4: "Do you have a newsletter I can subscribe to?",
  faq_a_4: "Yes. Enter your email in the footer to hear about new arrivals, styling notes and store news. You can unsubscribe at any time.",

  store_address: "12 Sample Street, Your City",
  store_phone: "+00 000 000 000",
  store_email: "hello@example.com",
  store_hours: "All Day: 9:00AM - 22:00PM",
  social_facebook: "#",
  social_instagram: "#",
  social_x: "#",
  social_youtube: "#",
  social_tiktok: "#",

  footer_newsletter_heading: "Subscribe Our Newsletter",
  footer_newsletter_text: "Join our newsletter for new arrivals, styling notes and the latest news delivered straight to your inbox!",
  footer_thanks_heading: "Thank You For Choosing Us!",
  footer_thanks_text: "We appreciate your support and are dedicated to providing you with the best products and service. We look forward to serving you again!",

  popup_heading: "Newsletter",
  popup_text: "Be the first to know about new arrivals, styling notes and store news, sent straight to your inbox.",
};

const VELOUR_IMAGES = {
  banner_image_1: `${A}/hero-1.jpg`,
  banner_image_2: `${A}/hero-2.jpg`,
  banner_image_3: `${A}/hero-3.jpg`,
  gallery_image_1: `${A}/tile-1.jpg`,
  gallery_image_2: `${A}/tile-2.jpg`,
  gallery_image_3: `${A}/tile-3.jpg`,
  gallery_image_4: `${A}/tile-4.jpg`,  showcase_image_1: `${A}/show-1.jpg`,
  showcase_image_2: `${A}/show-2.jpg`,
  showcase_image_3: `${A}/show-3.jpg`,
  showcase_image_4: `${A}/show-4.jpg`,
  statement_image: `${A}/statement.jpg`,
  lookbook_image: `${A}/lookbook.jpg`,
  customer_avatar_1: `${A}/avatar-1.jpg`,
  customer_avatar_2: `${A}/avatar-2.jpg`,
  customer_avatar_3: `${A}/avatar-3.jpg`,
  story_image_1: `${A}/story-1.jpg`,
  story_image_2: `${A}/story-2.jpg`,
  story_image_3: `${A}/story-3.jpg`,
  popup_image: `${A}/popup.jpg`,
  collection_banner: `${A}/banner.jpg`,
  brand_logo_1: `${A}/brand-1.svg`,
  brand_logo_2: `${A}/brand-2.svg`,
  brand_logo_3: `${A}/brand-3.svg`,
  brand_logo_4: `${A}/brand-4.svg`,
  brand_logo_5: `${A}/brand-5.svg`,
};

// title, type, price, compare-at price, has variants, available
const PRODUCTS = [
  ["Belted Wool Wrap Coat", "Outerwear", 18900, 22000, true, true],
  ["Ribbed Merino Turtleneck", "Knitwear", 7900, null, true, true],
  ["Satin Slip Midi Dress", "Dresses", 9800, 11800, true, true],
  ["High Rise Straight Jeans", "Denim", 8900, null, true, true],
  ["Relaxed Linen Shirt", "Shirts", 6500, null, false, true],
  ["Pleated Wide Leg Trousers", "Tailoring", 9500, 11000, true, false],
  ["Cropped Boucle Jacket", "Outerwear", 14500, null, false, true],
  ["Tiered Cotton Maxi Dress", "Dresses", 11000, null, true, true],
];

const SIZES = ["XS", "S", "M", "L", "XL"];

const DEMO_PRODUCTS = PRODUCTS.map(([title, type, price, compareAt, hasVariants, available], i) => {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `velour-${i + 1}`,
    title,
    type,
    handle,
    url: `/products/${handle}`,
    price,
    ...(compareAt ? { compare_at_price: compareAt } : {}),
    available,
    has_only_default_variant: !hasVariants,
    featured_image: `${A}/product-${i + 1}.jpg`,
    second_image: `${A}/product-${i + 1}b.jpg`,
    selected_or_first_available_variant: { id: `velour-variant-${i + 1}` },
  };
});

const DEMO_ARTICLES = [
  {
    title: "The Quiet Appeal Of Clothes That Are Made To Last",
    image: `${A}/blog-1.jpg`,
    excerpt_or_content: "Fewer, better pieces make getting dressed simpler. Here is what to look for in a seam, a fabric and a cut before you buy.",
  },
  {
    title: "How To Build A Capsule Wardrobe For Every Occasion",
    image: `${A}/blog-2.jpg`,
    excerpt_or_content: "Start with the shapes you already reach for most. A handful of neutral layers can carry you through almost any week.",
  },
  {
    title: "Caring For Wool And Linen So They Keep Their Shape",
    image: `${A}/blog-3.jpg`,
    excerpt_or_content: "A little brushing and the right hanger go a long way. These small habits keep your favorite clothes looking new for years.",
  },
].map((a, i) => ({ ...a, url: `/blogs/news/post-${i + 1}`, author: "Velour Team", published_at: `2026-0${i + 7}-17` }));

const link = (title, url = "#", links) => ({ title, url, ...(links ? { links } : {}) });

const DEMO_NAV = [
  { ...link("Home", "/"), active: true },
  link("Collections", "/collections", [
    link("Best Sellers", "/collections/best-sellers"),
    link("New Arrivals", "/collections/new-arrivals"),
    link("Denim Collection", "/collections/denim"),
    link("Women", "/collections/women", [
      link("Dresses", "/collections/dresses"),
      link("Knitwear", "/collections/knitwear"),
      link("Tailoring", "/collections/tailoring"),
      link("Outerwear", "/collections/outerwear"),
    ]),
    link("Men", "/collections/men", [
      link("Shirts", "/collections/shirts"),
      link("Trousers", "/collections/trousers"),
      link("Jackets", "/collections/jackets"),
    ]),
    link("Occasion", "/collections/occasion", [
      link("Workwear", "/collections/workwear"),
      link("Weekend", "/collections/weekend"),
      link("Evening", "/collections/evening"),
    ]),
  ]),
  link("Products", "/collections/all", [
    link("Coats", "/collections/outerwear"),
    link("Dresses", "/collections/dresses"),
    link("Jeans", "/collections/denim"),
    link("Knitwear", "/collections/knitwear"),
  ]),
  link("Pages", "/pages/about", [
    link("About Us", "/pages/about"),
    link("Contact", "/pages/contact"),
    link("FAQ", "/pages/faq"),
  ]),
  link("Blog", "/blogs/news"),
];

const value = (label, count, param) => ({ label, value: label, count, param_name: param, active: false });

/** Same shape as Shopify's `collection.filters`. */
const DEMO_FILTERS = [
  { type: "list", label: "Availability", values: [value("In stock", 7, "filter.v.availability"), value("Out of stock", 1, "filter.v.availability")] },
  { type: "price_range", label: "Price", range_max: 22000, min_value: { param_name: "filter.v.price.gte" }, max_value: { param_name: "filter.v.price.lte" } },
  {
    type: "list",
    presentation: "swatch",
    label: "Color",
    values: [
      { ...value("Camel", 2, "filter.v.option.color"), swatch: { color: "#c19a6b" } },
      { ...value("Cream", 3, "filter.v.option.color"), swatch: { color: "#f1e9da" } },
      { ...value("Sage", 1, "filter.v.option.color"), swatch: { color: "#8a9a7b" } },
      { ...value("Charcoal", 2, "filter.v.option.color"), swatch: { color: "#3b3b3b" } },
    ],
  },
  { type: "list", label: "Size", values: SIZES.map((v) => value(v, 6, "filter.v.option.size")) },
  { type: "list", label: "Product Type", values: [value("Outerwear", 2, "filter.p.product_type"), value("Dresses", 2, "filter.p.product_type"), value("Knitwear", 1, "filter.p.product_type")] },
];

const DEMO_COLLECTION = {
  title: "Dresses",
  url: "/collections/dresses",
  description: "<p>Fluid shapes and considered fabrics, cut for slow mornings and late dinners alike. Browse the full range of dresses and find the one you will keep reaching for all season, whatever the occasion on your calendar.</p><p>Every style is chosen for how it falls, how it feels and how easily it fits into the wardrobe you already own.</p>",
  all_tags: ["Cotton", "Linen", "Maxi", "Midi", "Satin", "Silk", "Summer", "Wool"],
  products: DEMO_PRODUCTS,
  products_count: DEMO_PRODUCTS.length,
  filters: DEMO_FILTERS,
  sort_by: "manual",
  sort_options: [
    { value: "manual", name: "Featured" },
    { value: "best-selling", name: "Best selling" },
    { value: "title-ascending", name: "Alphabetically, A-Z" },
    { value: "price-ascending", name: "Price, low to high" },
    { value: "price-descending", name: "Price, high to low" },
  ],
};

const COLLECTION_NAMES = ["Best Sellers", "Dresses", "Denim", "Knitwear", "Outerwear", "Tailoring", "Shirts", "New Arrivals", "Weekend"];
const COLLECTION_PICTURES = ["product-1", "tile-1", "tile-4", "tile-3", "tile-2", "product-6", "product-5", "product-7", "product-8"];

const DEMO_COLLECTION_LIST = COLLECTION_NAMES.map((title, i) => ({
  title,
  handle: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  url: `/collections/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  products_count: 3 + ((i * 5) % 7),
  featured_image: `${A}/${COLLECTION_PICTURES[i]}.jpg`,
}));

const link_list = (items) => items.map(([title, url]) => link(title, url));

const payBadge = (label) =>
  `<span style="display:inline-grid;place-items:center;width:38px;height:24px;border:1px solid #e3e4ea;border-radius:3px;background:#fff;color:#1f2a44;font:700 8px/1 sans-serif">${label}</span>`;

/**
 * Menus and payment badges for any Velour preview: these come from the merchant's Shopify settings
 * on the live store, which a preview cannot read.
 */
export const VELOUR_PREVIEW_CHROME = {
  demo_nav: DEMO_NAV,
  demo_footer_links: link_list([
    ["FAQs", "/pages/faq"],
    ["Size Guide", "/pages/size-guide"],
    ["Contact Us", "/pages/contact"],
    ["Gift Card", "/products/gift-card"],
  ]),
  demo_policies: link_list([
    ["Shipping Policy", "/policies/shipping-policy"],
    ["Refund Policy", "/policies/refund-policy"],
    ["Terms of Service", "/policies/terms-of-service"],
    ["Privacy Policy", "/policies/privacy-policy"],
  ]),
  demo_locale: "United States | USD $ · English",
  demo_payments: ["VISA", "PAY", "DISC", "MC", "PP"].map(payBadge).join(""),
};

const CATALOG = DEMO_PRODUCTS.map((p) => ({
  url: p.url,
  title: p.title,
  type: p.type,
  price: p.price,
  compare_at_price: p.compare_at_price || null,
  featured_image: p.featured_image,
  description: "A considered piece with a clean cut and a soft hand feel, made to be worn often and kept for years.",
  variants: p.has_only_default_variant
    ? [{ id: p.selected_or_first_available_variant.id, title: "Default", price: p.price, available: p.available }]
    : SIZES.map((size, i) => ({ id: `${p.id}-${size}`, title: size, price: p.price, available: p.available && i !== 4 })),
}));

/**
 * Makes the sample preview behave like a store. The preview's navigation lock already stops every
 * link and form, so this only decides what each click means: ask the host for a page it can show,
 * or explain that the page exists on the live store. Cart and quick view run on the sample catalog.
 */
const DEMO_RUNTIME = `<script>
(function () {
  var KEY = "vr-preview-cart";
  var CATALOG = ${JSON.stringify(CATALOG)};
  var PAGES = /^\\/$|^\\/collections(\\/[^/]+)?$|^\\/products\\/[^/]+$|^\\/pages\\/(about|contact|faq)$/;
  var vr = window.__vr;
  function lines() { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(items) { try { sessionStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function find(id) {
    for (var i = 0; i < CATALOG.length; i++) {
      var variants = CATALOG[i].variants;
      for (var j = 0; j < variants.length; j++) if (String(variants[j].id) === String(id)) return { product: CATALOG[i], variant: variants[j] };
    }
    return null;
  }
  function cart() {
    var items = lines().map(function (line) {
      var hit = find(line.id);
      return { product_title: hit.product.title, url: hit.product.url, image: hit.product.featured_image, variant_title: hit.variant.title === "Default" ? null : hit.variant.title, quantity: line.quantity, final_line_price: hit.variant.price * line.quantity };
    });
    return {
      items: items,
      currency: "USD",
      item_count: items.reduce(function (n, i) { return n + i.quantity; }, 0),
      total_price: items.reduce(function (n, i) { return n + i.final_line_price; }, 0),
    };
  }
  if (vr) {
    vr.api.cart = function () { return Promise.resolve(cart()); };
    vr.api.add = function (id, quantity) {
      if (!find(id)) return Promise.reject(new Error("This item is not in the sample store."));
      var items = lines(), hit = items.filter(function (l) { return String(l.id) === String(id); })[0];
      if (hit) hit.quantity += quantity || 1; else items.push({ id: id, quantity: quantity || 1 });
      save(items);
      return Promise.resolve(cart());
    };
    vr.api.change = function (line, quantity) {
      var items = lines();
      if (quantity > 0) items[line - 1].quantity = quantity; else items.splice(line - 1, 1);
      save(items);
      return Promise.resolve(cart());
    };
    vr.api.product = function (url) {
      var product = CATALOG.filter(function (p) { return p.url === url; })[0];
      return product ? Promise.resolve(product) : Promise.reject(new Error("Not in the sample store."));
    };
    vr.api.cart().then(function (c) { document.querySelectorAll("[data-vr-cart-count]").forEach(function (el) { el.textContent = c.item_count; }); });
  }
  function note(message) { if (vr) vr.toast(message); }
  // The app's iframe sandbox has no allow-forms, so a submit event never fires: read the button click.
  document.addEventListener("click", function (event) {
    if (!event.target.closest) return;
    if (event.target.closest("[data-vr-open], [data-vr-quick], [data-vr-add], [data-vr-wish], [data-vr-line], [data-vr-close]")) return;
    if (event.target.closest("[data-vr-video]")) { note("Your video plays here on the live store."); return; }
    if (event.target.closest("[data-vr-demo-buy]")) { note("Checkout opens on your live store."); return; }
    var button = event.target.closest('button[type="submit"]');
    if (button && button.form) {
      if (button.form.querySelector('[name="contact[email]"]')) {
        if (button.form.reportValidity()) { button.form.reset(); note("Thanks for subscribing."); }
      } else if (button.form.querySelector('[name="q"]')) {
        note("Search runs on your live store.");
      }
      return;
    }
    var a = event.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href === "" || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
    if (PAGES.test(href)) window.parent.postMessage({ type: "VELOUR_PREVIEW_NAVIGATE", href: href }, "*");
    else note("This page opens on your live store.");
  });
  document.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches("[data-vr-autosubmit]")) note("Filters and sorting work on your live store.");
  });
})();
</script>`;

const titleFromHandle = (handle) =>
  handle === "all"
    ? "All Products"
    : DEMO_COLLECTION_LIST.find((c) => c.handle === handle)?.title ||
      handle.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** The demo collection for a handle: products of that type, or all of them. */
function demoCollection(handle = "new-arrivals") {
  const keyword = handle.split("-").pop().replace(/s$/, "");
  const matching = DEMO_PRODUCTS.filter((p) => p.type.toLowerCase().replace(/s$/, "") === keyword);
  const products = matching.length > 0 ? matching : DEMO_PRODUCTS;
  return {
    ...DEMO_COLLECTION,
    title: titleFromHandle(handle),
    url: `/collections/${handle}`,
    products,
    // A whole-range view pretends there is a second page, so the sample shows the load more meter.
    products_count: matching.length > 0 ? products.length : 24,
  };
}

/** Store-level home data for the Velour template demo and preview. */
export function buildVelourHomeData(collectionHandle) {
  return {
    text: { ...VELOUR_TEXT },
    images: { ...VELOUR_IMAGES },
    demo_products: DEMO_PRODUCTS,
    demo_articles: DEMO_ARTICLES,
    demo_collection: demoCollection(collectionHandle),
    demo_collection_list: DEMO_COLLECTION_LIST,
    demo_runtime: DEMO_RUNTIME,
    // Twelve days ahead, so the sample timer always has time left to count down.
    demo_deal_end: new Date(Date.now() + 12 * 86400000).toISOString(),
    demo_video_url: "https://www.youtube.com/watch?v=sample",
    demo_shipping_tab: "<p>Orders are packed with care and sent with tracking. Your own shipping policy appears here on the live store.</p>",
    demo_returns_tab: "<p>Something not quite right? Your own refund policy appears here on the live store.</p>",
  };
}

/** One demo product in the dashboard shape the product page preview reads; the first by default. */
export function buildVelourDemoProduct(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  const money = (cents) => (cents / 100).toFixed(2);
  const pictures = [p.featured_image, p.second_image];
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    description:
      "<p>A considered piece with a clean cut and a soft hand feel, made to be worn often and kept for years. It layers easily and works with the clothes you already own.</p><h3>Details and care</h3><ul><li>Relaxed, easy fit</li><li>Soft, breathable fabric</li><li>Follow the care label inside the garment</li><li>Store folded or on a wide hanger</li></ul>",
    featuredImage: { url: p.featured_image, altText: p.title },
    images: { edges: pictures.map((url) => ({ node: { url, altText: p.title } })) },
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

/** Sample-store fields the product preview adds to the mapped product: type, tags, sizes and stock. */
export function buildVelourDemoProductExtras(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  if (p.has_only_default_variant) {
    const id = p.selected_or_first_available_variant.id;
    return {
      type: p.type,
      url: p.url,
      handle: p.handle,
      tags: ["Cotton", "Linen", "New"],
      has_only_default_variant: true,
      selected_or_first_available_variant: { id, price: p.price, compare_at_price: p.compare_at_price, available: p.available, sku: `VL-${p.id.split("-")[1]}00` },
    };
  }
  const variants = SIZES.map((size, i) => ({
    id: `${p.id}-${size}`,
    title: size,
    options: [size],
    price: p.price,
    compare_at_price: p.compare_at_price || null,
    available: p.available && i !== 4,
    sku: `VL-${p.id.split("-")[1]}${i}`,
  }));
  return {
    type: p.type,
    url: p.url,
    handle: p.handle,
    tags: ["Cotton", "Linen", "New"],
    has_only_default_variant: false,
    variants,
    selected_or_first_available_variant: variants.find((v) => v.available) || variants[0],
    options_with_values: [{ name: "Size", values: SIZES, selected_value: (variants.find((v) => v.available) || variants[0]).title }],
  };
}

/**
 * Where a link inside the sample preview goes. Returns the home view, a product, or an inner page
 * shown in place of the home view; null for a page the preview does not have.
 */
export function resolveVelourPreviewLink(href) {
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

/** Product cards for the Velour demo, in the dashboard product shape the preview maps from. */
export function buildVelourDemoGridProducts() {
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

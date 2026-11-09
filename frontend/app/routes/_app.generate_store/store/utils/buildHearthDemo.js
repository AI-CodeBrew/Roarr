/**
 * Hearth demo: text, pictures and catalog for the in-app preview and template card. A kitchen store
 * with exactly three products. Real generation replaces the copy and pictures, and the live storefront
 * uses the merchant's own menus, products and articles, so everything named `demo_*` exists only here.
 * Pictures come from backend/scripts/generate_hearth_demo_images.py.
 */

const A = "/hearth-assets";

const HEARTH_TEXT = {
  store_name: "Hearth",

  ticker_text_1: "Secure checkout on every order",
  ticker_text_2: "Kitchen pieces made to last",
  ticker_text_3: "Packed with care",

  hero_kicker_1: "The ultimate kitchen upgrade",
  banner_heading_1: "Transform Your Prep With Solid Acacia Boards",
  banner_text_1: "Warm wood grain and a generous surface that is kind to your knives, made for the way you cook every single day.",
  hero_kicker_2: "Where craft meets everyday cooking",
  banner_heading_2: "Discover Our Brushed Steel Utensil Collection",
  banner_text_2: "Balanced handles and clean lines that move easily from the hob to the table, and stay looking good for years.",
  hero_kicker_3: "Keep every shelf in order",
  banner_heading_3: "Store Your Spices In Glazed Stoneware",
  banner_text_3: "Speckled jars with snug wooden lids that keep flavours fresh and look beautiful out on the counter.",

  policy_1_title: "Free Shipping",
  policy_1_text: "Enjoy the convenience of free shipping on all orders over $50",
  policy_2_title: "Buy Now. Pay Later",
  policy_2_text: "Shop now, pay later - get your kitchen favorites and pay in installments",
  policy_3_title: "Cashback Reward",
  policy_3_text: "Earn cashback rewards on every purchase and enjoy savings on your next order",
  policy_4_title: "Secure Payments",
  policy_4_text: "Shop confidently with secure payments that protect your information",

  gallery_title_1: "Boards",
  collection_1: "boards",
  gallery_title_2: "Utensils",
  collection_2: "utensils",
  gallery_title_3: "Storage",
  collection_3: "storage",
  gallery_title_4: "Shop All",
  collection_4: "all",

  deal_kicker: "Special deals",
  deal_heading: "Kitchen Favorites Are Waiting For You",
  deal_text: "Take a look through this season's most loved kitchen pieces.",

  showcase_kicker: "Collection",
  showcase_heading: "Discover The Craft In Our Kitchen",
  showcase_title_1: "Prep",
  showcase_text_1: "A wide acacia surface with room to chop, slice and share, kind to your knives and easy to clean.",
  showcase_title_2: "Cook",
  showcase_text_2: "Brushed steel tools with a confident weight in the hand, ready for high heat and everyday use.",
  showcase_title_3: "Serve",
  showcase_text_3: "Carry your board straight to the table, and let good wood and good food do the talking.",
  showcase_title_4: "Store",
  showcase_text_4: "Glazed stoneware jars that keep spices fresh and within reach, right where you cook.",

  arrivals_kicker: "Our products",
  arrivals_heading: "New Arrivals",

  statement_kicker: "The perfect kitchen upgrade",
  statement_heading: "Revamp Your Counter With Statement Boards",
  statement_text: "One beautiful board changes the whole counter. Find the piece you will reach for at every meal.",

  lookbook_kicker: "Trending now",
  lookbook_heading: "Pieces You'll Love",

  testimonials_kicker: "Testimonials",
  testimonials_heading: "Our Customers Reviews",
  customer_name_1: "Maya Ellison",
  customer_role_1: "Sample review",
  customer_review_1: "I absolutely love my new board. The wood is beautiful, it feels solid on the counter, and it still looks brand new after months of daily chopping.",
  customer_name_2: "Noor Valencia",
  customer_role_2: "Sample review",
  customer_review_2: "The utensil set is even nicer in person. Everything feels balanced in the hand, cleans up easily and looks lovely hanging by the stove.",
  customer_name_3: "Theo Marlow",
  customer_role_3: "Sample review",
  customer_review_3: "Shopping here has been easy from start to finish. The spice jars are gorgeous, the lids fit snugly and my shelf has never looked better.",

  story_kicker: "Newest product this year",
  story_heading_1: "Cook With Tools Made To Last",
  story_text_1: "Cook with our exclusive kitchen collection, designed to make every meal easier. Each piece pairs honest materials with a comfortable shape, perfect for the way you cook.",
  story_heading_2: "Explore Fresh Ideas For Your Kitchen!",
  story_text_2: "Explore our latest kitchen pieces and fresh ways to use them. From weeknight dinners to slow weekend cooking, find the tools that make your time at the counter better.",
  story_heading_3: "Elevate Your Counter With Beautiful Everyday Pieces",
  story_text_3: "Elevate your counter with pieces worth leaving out. Warm wood, brushed steel and glazed stoneware work together, and they get better the more you use them.",

  blog_kicker: "Our blog",
  blog_heading: "From Our Journal",

  faq_heading: "Frequently Asked Questions",
  faq_q_1: "How do I care for a wooden cutting board?",
  faq_a_1: "Hand wash it with mild soap, dry it upright and rub in a little food-safe oil now and then. Keep it out of the dishwasher so the wood stays smooth and flat. A little regular care keeps a good board looking handsome and working well for many years.",
  faq_q_2: "Are the utensils safe for my pans?",
  faq_a_2: "Brushed steel is ideal for steel and cast iron pans. For nonstick surfaces, reach for a softer tool, as metal edges can leave marks on the coating over time.",
  faq_q_3: "How can I contact customer service?",
  faq_a_3: "You can reach our team through the contact page. Tell us your order number if you have one and we will get back to you as soon as we can.",
  faq_q_4: "Do you have a newsletter I can subscribe to?",
  faq_a_4: "Yes. Enter your email in the footer to hear about new arrivals, kitchen notes and store news. You can unsubscribe at any time.",

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
  footer_newsletter_text: "Join our newsletter for new arrivals, kitchen notes and the latest news delivered straight to your inbox!",
  footer_thanks_heading: "Thank You For Choosing Us!",
  footer_thanks_text: "We appreciate your support and are dedicated to providing you with the best products and service. We look forward to serving you again!",

  popup_heading: "Newsletter",
  popup_text: "Be the first to know about new arrivals, kitchen notes and store news, sent straight to your inbox.",
};

const HEARTH_IMAGES = {
  banner_image_1: `${A}/hero-1.jpg`,
  banner_image_2: `${A}/hero-2.jpg`,
  banner_image_3: `${A}/hero-3.jpg`,
  gallery_image_1: `${A}/tile-1.jpg`,
  gallery_image_2: `${A}/tile-2.jpg`,
  gallery_image_3: `${A}/tile-3.jpg`,
  gallery_image_4: `${A}/tile-4.jpg`,
  showcase_image_1: `${A}/show-1.jpg`,
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
  brand_logo_6: `${A}/brand-6.svg`,
  brand_logo_7: `${A}/brand-7.svg`,
  brand_logo_8: `${A}/brand-8.svg`,
};

const BOARD_SIZES = ["Small", "Medium", "Large"];

// title, type, price, compare-at price, sizes (null when there is only one variant)
const PRODUCTS = [
  ["Acacia Wood Cutting Board", "Boards", 4800, 5600, BOARD_SIZES],
  ["Brushed Steel Utensil Set", "Utensils", 6400, 7200, null],
  ["Stoneware Spice Jar Set", "Storage", 3800, 4400, null],
];

const DEMO_PRODUCTS = PRODUCTS.map(([title, type, price, compareAt, sizes], i) => {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `hearth-${i + 1}`,
    title,
    type,
    handle,
    url: `/products/${handle}`,
    price,
    compare_at_price: compareAt,
    available: true,
    has_only_default_variant: !sizes,
    featured_image: `${A}/product-${i + 1}.jpg`,
    second_image: `${A}/product-${i + 1}b.jpg`,
    third_image: `${A}/product-${i + 1}c.jpg`,
    selected_or_first_available_variant: { id: `hearth-variant-${i + 1}` },
  };
});

const SIZES_BY_ID = Object.fromEntries(PRODUCTS.map((p, i) => [`hearth-${i + 1}`, p[4]]));

const DESCRIPTIONS = {
  "hearth-1": "<p>A generous acacia board with warm, naturally varied grain. It is kind to your knives, steady on the counter and handsome enough to carry straight to the table, whether you are slicing bread or serving a spread for friends.</p><p>Each board is sanded smooth and finished with food-safe oil, so it is ready to use from the first day.</p><h3>Care and details</h3><ul><li>Solid acacia wood</li><li>Hand wash with mild soap</li><li>Dry upright after washing</li><li>Oil now and then to keep the wood smooth</li><li>Not for the dishwasher</li></ul>",
  "hearth-2": "<p>Four everyday tools in brushed stainless steel: a ladle, a slotted spoon, a turner and a pair of tongs. Each one has a comfortable, balanced handle and a soft finish that hides fingerprints and looks good hanging by the stove.</p><p>They are made for steel and cast iron pans and clean up in moments.</p><h3>Care and details</h3><ul><li>Brushed stainless steel</li><li>Set of four tools</li><li>Dishwasher safe</li><li>Hanging loop on every handle</li><li>Use a softer tool on nonstick pans</li></ul>",
  "hearth-3": "<p>Three speckled stoneware jars with snug wooden lids, sized for the spices you reach for most. The glaze wipes clean, the lids lift off with one hand and the set looks lovely out on an open shelf.</p><p>Keep them close to the hob and away from direct heat so your spices stay fresh for longer.</p><h3>Care and details</h3><ul><li>Glazed stoneware with wooden lids</li><li>Set of three jars</li><li>Wash jars by hand</li><li>Wipe lids with a damp cloth</li><li>Keep away from direct heat</li></ul>",
};

const plainText = (html) => html.replace(/<\/[^>]+>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const DEMO_ARTICLES = [
  {
    title: "The Quiet Appeal Of Kitchen Tools Made To Last",
    image: `${A}/blog-1.jpg`,
    excerpt_or_content: "Fewer, better tools make cooking simpler and calmer. Here is what to look for in a handle, a joint and a finish before you buy your next kitchen piece, and why it pays off for years to come.",
  },
  {
    title: "How To Choose The Perfect Cutting Board For Your Kitchen",
    image: `${A}/blog-2.jpg`,
    excerpt_or_content: "Size, grain and thickness all matter more than you might think when you choose a board. A good one can last for decades, so it is worth taking a little time and care before you settle on yours.",
  },
  {
    title: "Keeping Spices Fresh With Simple Storage That Looks Great All Year",
    image: `${A}/blog-3.jpg`,
    excerpt_or_content: "Light and heat are what fade flavour fastest in the kitchen. These small storage habits keep your spices tasting bright for longer, and they keep your shelves looking beautiful and easy to use as well.",
  },
].map((a, i) => ({ ...a, url: `/blogs/news/post-${i + 1}`, author: "Hearth Team", published_at: `2026-0${i + 7}-17` }));

const link = (title, url = "#", links) => ({ title, url, ...(links ? { links } : {}) });

const DEMO_NAV = [
  { ...link("Home", "/"), active: true },
  link("Collections", "/collections", [
    link("Best Sellers", "/collections/all"),
    link("New Arrivals", "/collections/all"),
    link("Shop All", "/collections/all"),
    link("Prep", "/collections/boards", [
      link("Cutting Boards", "/collections/boards"),
      link("Serving Boards", "/collections/boards"),
    ]),
    link("Cook", "/collections/utensils", [
      link("Utensil Sets", "/collections/utensils"),
      link("Everyday Tools", "/collections/utensils"),
    ]),
    link("Store", "/collections/storage", [
      link("Spice Jars", "/collections/storage"),
      link("Counter Storage", "/collections/storage"),
    ]),
  ]),
  link("Products", "/collections/all", [
    link("Shop Our Products", "/collections/all", DEMO_PRODUCTS.map((p) => link(p.title, p.url))),
    link("Shop By Use", "/collections/all", [
      link("Prep", "/collections/boards"),
      link("Cook", "/collections/utensils"),
      link("Serve", "/collections/boards"),
      link("Store", "/collections/storage"),
    ]),
    link("Customer Care", "/pages/contact", [
      link("Contact Us", "/pages/contact"),
      link("FAQs", "/pages/faq"),
      link("About Us", "/pages/about"),
    ]),
  ]),
  link("Pages", "/pages/about", [
    link("About Us", "/pages/about"),
    link("Contact Us", "/pages/contact"),
    link("FAQs Page", "/pages/faq"),
  ]),
  link("Blog", "/blogs/news", [
    link("From Our Journal", "/blogs/news"),
    link("Care Guides", "/blogs/news"),
  ]),
];

const value = (label, count, param) => ({ label, value: label, count, param_name: param, active: false });

/** Same shape as Shopify's `collection.filters`. */
const filtersFor = (products) => {
  const has = (type) => products.filter((p) => p.type === type).length;
  return [
    { type: "list", label: "Availability", url_to_remove: "#", values: [value("In stock", products.length, "filter.v.availability"), value("Out of stock", 0, "filter.v.availability")] },
    { type: "price_range", label: "Price", url_to_remove: "#", range_max: 7200, min_value: { param_name: "filter.v.price.gte" }, max_value: { param_name: "filter.v.price.lte" } },
    {
      type: "list",
      presentation: "swatch",
      label: "Color",
      url_to_remove: "#",
      values: [
        { ...value("Natural", has("Boards"), "filter.v.option.color"), swatch: { color: "#a9744a" } },
        { ...value("Steel", has("Utensils"), "filter.v.option.color"), swatch: { color: "#b9bcc0" } },
        { ...value("Sand", has("Storage"), "filter.v.option.color"), swatch: { color: "#e4dccb" } },
      ],
    },
    {
      type: "list",
      label: "Material",
      url_to_remove: "#",
      values: [value("Acacia wood", has("Boards"), "filter.p.m.custom.material"), value("Stainless steel", has("Utensils"), "filter.p.m.custom.material"), value("Stoneware", has("Storage"), "filter.p.m.custom.material")],
    },
    {
      type: "list",
      label: "Product Type",
      url_to_remove: "#",
      values: [value("Boards", has("Boards"), "filter.p.product_type"), value("Utensils", has("Utensils"), "filter.p.product_type"), value("Storage", has("Storage"), "filter.p.product_type")],
    },
  ];
};

const DEMO_COLLECTION = {
  title: "All Products",
  url: "/collections/all",
  description: "<p>Three honest pieces for the kitchen you use every day: a solid acacia board, a brushed steel utensil set and a family of glazed stoneware spice jars. Each one is chosen for how it feels in the hand and how well it holds up to real cooking.</p><p>Everything here works together and is made to be left out on the counter, ready for the next meal, whatever you happen to be cooking this week.</p>",
  all_tags: ["Acacia", "Boards", "Kitchen", "Spices", "Steel", "Stoneware", "Storage", "Utensils"],
  sort_by: "manual",
  sort_options: [
    { value: "manual", name: "Featured" },
    { value: "best-selling", name: "Best selling" },
    { value: "title-ascending", name: "Alphabetically, A-Z" },
    { value: "price-ascending", name: "Price, low to high" },
    { value: "price-descending", name: "Price, high to low" },
  ],
};

const DEMO_COLLECTION_LIST = [
  ["Boards", "tile-1"],
  ["Utensils", "tile-2"],
  ["Storage", "tile-3"],
].map(([title, picture]) => {
  const handle = title.toLowerCase();
  return { title, handle, url: `/collections/${handle}`, products_count: 1, featured_image: `${A}/${picture}.jpg` };
});

const link_list = (items) => items.map(([title, url]) => link(title, url));

const payBadge = (label) =>
  `<span style="display:inline-grid;place-items:center;width:38px;height:24px;border:1px solid #e3e4ea;border-radius:3px;background:#fff;color:#1f2a44;font:700 8px/1 sans-serif">${label}</span>`;

/**
 * Menus and payment badges for any Hearth preview: these come from the merchant's Shopify settings
 * on the live store, which a preview cannot read.
 */
export const HEARTH_PREVIEW_CHROME = {
  demo_nav: DEMO_NAV,
  demo_footer_links: link_list([
    ["FAQs", "/pages/faq"],
    ["Terms Of Service", "/policies/terms-of-service"],
    ["Contact Us", "/pages/contact"],
    ["Gift Card", "/products/gift-card"],
  ]),
  demo_policies: link_list([
    ["Shipping Policy", "/policies/shipping-policy"],
    ["Terms of Service", "/policies/terms-of-service"],
    ["Privacy Policy", "/policies/privacy-policy"],
  ]),
  demo_locale: "United States | USD $ · English",
  demo_payments: ["VISA", "PAY", "DISC", "MC", "PP"].map(payBadge).join(""),
};

const skuFor = (id, part = 0) => `HH-${id.split("-")[1]}0${part}`;

const CATALOG = DEMO_PRODUCTS.map((p) => {
  const sizes = SIZES_BY_ID[p.id];
  return {
    url: p.url,
    title: p.title,
    type: p.type,
    price: p.price,
    compare_at_price: p.compare_at_price,
    featured_image: p.featured_image,
    images: [p.featured_image, p.second_image, p.third_image],
    description: plainText(DESCRIPTIONS[p.id]),
    variants: sizes
      ? sizes.map((size, i) => ({ id: `${p.id}-${size}`, title: size, price: p.price, compare_at_price: p.compare_at_price, available: true, sku: skuFor(p.id, i) }))
      : [{ id: p.selected_or_first_available_variant.id, title: "Default", price: p.price, compare_at_price: p.compare_at_price, available: true, sku: skuFor(p.id) }],
  };
});

/**
 * Makes the sample preview behave like a store. The preview's navigation lock already stops every
 * link and form, so this only decides what each click means: ask the host for a page it can show,
 * or explain that the page exists on the live store. Cart and quick view run on the sample catalog.
 */
const DEMO_RUNTIME = `<script>
(function () {
  var KEY = "hh-preview-cart";
  var CATALOG = ${JSON.stringify(CATALOG)};
  var PAGES = /^\\/$|^\\/collections(\\/[^/]+)?$|^\\/products\\/[^/]+$|^\\/pages\\/(about|contact|faq)$/;
  var hh = window.__hh;
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
  if (hh) {
    hh.api.cart = function () { return Promise.resolve(cart()); };
    hh.api.add = function (id, quantity) {
      if (!find(id)) return Promise.reject(new Error("This item is not in the sample store."));
      var items = lines(), hit = items.filter(function (l) { return String(l.id) === String(id); })[0];
      if (hit) hit.quantity += quantity || 1; else items.push({ id: id, quantity: quantity || 1 });
      save(items);
      return Promise.resolve(cart());
    };
    hh.api.change = function (line, quantity) {
      var items = lines();
      if (quantity > 0) items[line - 1].quantity = quantity; else items.splice(line - 1, 1);
      save(items);
      return Promise.resolve(cart());
    };
    hh.api.product = function (url) {
      var product = CATALOG.filter(function (p) { return p.url === url; })[0];
      return product ? Promise.resolve(product) : Promise.reject(new Error("Not in the sample store."));
    };
    hh.api.buy = function () { hh.toast("Checkout opens on your live store."); };
    hh.api.cart().then(function (c) { document.querySelectorAll("[data-hh-cart-count]").forEach(function (el) { el.textContent = c.item_count; }); });
  }
  function note(message) { if (hh) hh.toast(message); }
  // The app's iframe sandbox has no allow-forms, so a submit event never fires: read the button click.
  document.addEventListener("click", function (event) {
    if (!event.target.closest) return;
    if (event.target.closest("[data-hh-open], [data-hh-quick], [data-hh-add], [data-hh-wish], [data-hh-line], [data-hh-close]")) return;
    if (event.target.closest("[data-hh-video]")) { note("Your video plays here on the live store."); return; }
    if (event.target.closest("[data-hh-demo-buy]")) { note("Checkout opens on your live store."); return; }
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
    if (href === "" || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) {
      if (a.classList.contains("hh-cl__reset")) note("Filters and sorting work on your live store.");
      return;
    }
    if (PAGES.test(href)) window.parent.postMessage({ type: "HEARTH_PREVIEW_NAVIGATE", href: href }, "*");
    else note("This page opens on your live store.");
  });
  document.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches("[data-hh-autosubmit], [data-hh-sort], [data-hh-range]")) note("Filters and sorting work on your live store.");
  });
})();
</script>`;

const titleFromHandle = (handle) =>
  handle === "all"
    ? "All Products"
    : DEMO_COLLECTION_LIST.find((c) => c.handle === handle)?.title ||
      handle.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** The demo collection for a handle: products of that type, or all three. */
function demoCollection(handle = "all") {
  const matching = DEMO_PRODUCTS.filter((p) => p.type.toLowerCase() === handle.toLowerCase());
  const products = matching.length > 0 ? matching : DEMO_PRODUCTS;
  return {
    ...DEMO_COLLECTION,
    title: titleFromHandle(handle),
    url: `/collections/${handle}`,
    products,
    products_count: products.length,
    filters: filtersFor(products),
  };
}

/** Store-level home data for the Hearth template demo and preview. */
export function buildHearthHomeData(collectionHandle) {
  return {
    text: { ...HEARTH_TEXT },
    images: { ...HEARTH_IMAGES },
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
    demo_product_notes: { note_1: "Orders ship within 5 to 10 business days.", note_2: "Your own shipping offer appears here on the live store." },
  };
}

/** One demo product in the dashboard shape the product page preview reads; the first by default. */
export function buildHearthDemoProduct(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  const money = (cents) => (cents / 100).toFixed(2);
  const pictures = [p.featured_image, p.second_image, p.third_image];
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: DESCRIPTIONS[p.id],
    featuredImage: { url: p.featured_image, altText: p.title },
    images: { edges: pictures.map((url) => ({ node: { url, altText: p.title } })) },
    variants: {
      edges: [
        {
          node: {
            id: p.selected_or_first_available_variant.id,
            price: money(p.price),
            compareAtPrice: money(p.compare_at_price),
          },
        },
      ],
    },
  };
}

/** Sample-store fields the product preview adds to the mapped product: type, tags, sizes and stock. */
export function buildHearthDemoProductExtras(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  const sizes = SIZES_BY_ID[p.id];
  const tags = [p.type, "Kitchen", "New"];
  if (!sizes) {
    const id = p.selected_or_first_available_variant.id;
    return {
      type: p.type,
      url: p.url,
      handle: p.handle,
      tags,
      has_only_default_variant: true,
      selected_or_first_available_variant: { id, price: p.price, compare_at_price: p.compare_at_price, available: true, sku: skuFor(p.id) },
    };
  }
  const variants = sizes.map((size, i) => ({
    id: `${p.id}-${size}`,
    title: size,
    options: [size],
    price: p.price,
    compare_at_price: p.compare_at_price,
    available: true,
    sku: skuFor(p.id, i),
  }));
  return {
    type: p.type,
    url: p.url,
    handle: p.handle,
    tags,
    has_only_default_variant: false,
    variants,
    selected_or_first_available_variant: variants[0],
    options_with_values: [{ name: "Size", values: sizes, selected_value: variants[0].title }],
  };
}

/**
 * Where a link inside the sample preview goes. Returns the home view, a product, or an inner page
 * shown in place of the home view; null for a page the preview does not have.
 */
export function resolveHearthPreviewLink(href) {
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

/** Product cards for the Hearth demo, in the dashboard product shape the preview maps from. */
export function buildHearthDemoGridProducts() {
  return DEMO_PRODUCTS.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.title,
    featuredImage: { url: p.featured_image, altText: p.title },
    images: { edges: [{ node: { url: p.featured_image, altText: p.title } }] },
    variants: { edges: [{ node: { id: p.selected_or_first_available_variant.id, price: (p.price / 100).toFixed(2) } }] },
  }));
}

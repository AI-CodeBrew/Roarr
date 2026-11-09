/**
 * Simmer demo: text, pictures and catalog for the in-app preview and template card. A kitchen
 * electronics store with exactly three products. Real generation replaces the copy and pictures, and
 * the live storefront uses the merchant's own menus, products and collections, so everything named
 * `demo_*` exists only here. Pictures come from backend/scripts/generate_simmer_demo_images.py.
 */

const A = "/simmer-assets";

const SIMMER_TEXT = {
  store_name: "Simmer",

  ticker_text_1: "New kitchen arrivals every season",
  ticker_text_2: "Secure checkout on every order",
  ticker_text_3: "Packed with care",

  hero_kicker_1: "Blend it your way",
  banner_heading_1: "Smoother Mornings Start With A Better Blender",
  banner_text_1: "Six speeds, a sturdy glass jar and a quiet motor for smoothies, soups and sauces every day.",
  hero_kicker_2: "Crisp without the oil",
  banner_heading_2: "Golden, Crispy Dinners In Half The Time",
  banner_text_2: "A roomy basket, simple presets and an easy-clean coating for weeknight cooking without the fuss.",
  hero_kicker_3: "Cafe coffee at home",
  banner_heading_3: "Pull A Perfect Espresso Every Single Morning",
  banner_text_3: "A steady pump, a steam wand for silky milk and a compact body that fits any counter.",
  hero_side_heading: "Kitchen Gifts",

  deal_kicker: "Special deals",
  deal_heading: "Fresh Kitchen Favorites Are Waiting For You",
  deal_text: "Take a look through this season's most loved appliances.",

  picks_kicker: "Categories",
  picks_heading: "Our Picks For You",
  picks_title_1: "Blenders",
  picks_text_1: "Powerful countertop blenders for silky smoothies, hot soups and nut butters, with jars that are easy to pour and rinse.",
  picks_title_2: "Air Fryers",
  picks_text_2: "Crisp fries, wings and roast vegetables with a fraction of the oil, using simple presets and a basket that cleans in seconds.",
  picks_title_3: "Coffee Machines",
  picks_text_3: "Espresso, cappuccino and long black at home, with a steam wand for milk and a compact body that suits any kitchen.",
  picks_title_4: "Smoothies",
  picks_text_4: "From green breakfasts to berry treats, find out how to build a balanced smoothie and get the smoothest texture every time.",
  picks_title_5: "Crispy Snacks",
  picks_text_5: "Learn the simple timings and temperatures that turn potatoes, chickpeas and halloumi into golden, crunchy snacks.",
  picks_title_6: "Morning Coffee",
  picks_text_6: "Dial in your grind, dose and milk texture for a richer cup, with tips for keeping your machine running at its best.",
  collection_1: "blenders",
  collection_2: "air-fryers",
  collection_3: "coffee-machines",
  collection_4: "blenders",
  collection_5: "air-fryers",
  collection_6: "coffee-machines",

  arrivals_kicker: "Our products",
  arrivals_heading: "New Arrivals",

  brands_kicker: "Brands",
  brands_quote: "Our Kitchen Appliances Are Designed To Make Every Meal Simpler, Empowering You To Cook Better Every Day And Making Each Day A Chance To Enjoy Good Food.",

  gallery_kicker: "Follow us",
  gallery_heading: "@SimmerKitchen",
  gallery_text: "Where good design meets everyday cooking. Discover recipes, kitchen ideas and new arrivals, and join our journey to better meals!",

  testimonials_kicker: "Testimonials",
  testimonials_heading: "Our Customers Reviews",
  customer_name_1: "Maya Ellison",
  customer_role_1: "Sample review",
  customer_review_1: "I absolutely love my new blender! It is quiet, powerful and the glass jar feels solid. My morning smoothies have never been this smooth.",
  customer_name_2: "Noor Valencia",
  customer_role_2: "Sample review",
  customer_review_2: "The air fryer is even better than I hoped. Fries come out golden and crispy, the basket cleans up in seconds and it looks great on the counter. I have used it almost every night since it arrived.",
  customer_name_3: "Theo Marlow",
  customer_role_3: "Sample review",
  customer_review_3: "Shopping here has been easy from start to finish. The espresso machine was simple to set up and I now make cafe-style coffee every morning.",
  customer_name_4: "Lena Ortiz",
  customer_role_4: "Sample review",
  customer_review_4: "I bought the blender as a gift for my sister and she was thrilled. It feels well made, and she uses it for soups as well as smoothies.",

  lookbook_kicker: "Lookbook",
  lookbook_heading: "Smart Tools & Timeless Style",
  lookbook_text: "Discover appliances that blend clean design with everyday ease. Our collection makes a calm, capable kitchen that is ready for every meal.",
  video_heading: "Discover The Appliances That Make Every Meal Easier!",

  faq_kicker: "FAQ",
  faq_heading: "Everything You Need To Know",
  faq_q_1: "How do I choose the right appliance?",
  faq_a_1: "Think about what you cook most often and how much counter space you have. Each product page lists the size, the settings and everything that comes in the box, so you can compare our appliances side by side and pick the one that suits your kitchen.",
  faq_q_2: "How do I clean and care for my appliances?",
  faq_a_2: "Unplug and let them cool, then wipe the body with a soft damp cloth. Removable parts such as jars and baskets can usually be washed in warm soapy water.",
  faq_q_3: "Are the appliances safe to leave on the counter?",
  faq_a_3: "Yes, when they are switched off and unplugged after use. Always follow the safety notes in the manual that comes with each product.",
  faq_q_4: "How can I contact customer service?",
  faq_a_4: "You can reach our team through the contact page. Tell us your order number if you have one and we will get back to you as soon as we can.",
  faq_q_5: "Do you have a newsletter I can subscribe to?",
  faq_a_5: "Yes. Enter your email in the footer to hear about new arrivals, recipes and store news. You can unsubscribe at any time.",
  faq_q_6: "Where can I find delivery and return details?",
  faq_a_6: "Our shipping and refund policy pages explain how orders are sent and how returns work. You will find them linked in the footer of every page.",

  policy_1_title: "Free Shipping",
  policy_1_text: "Enjoy the convenience of free shipping on all orders over $50",
  policy_1_link: "Shipping Options",
  policy_2_title: "Buy Now. Pay Later",
  policy_2_text: "Shop now, pay later - get your kitchen favorites and pay in installments!",
  policy_2_link: "How To Return An Item",
  policy_3_title: "Cashback Reward",
  policy_3_text: "Earn cashback rewards on every purchase and enjoy savings on your next order",
  policy_3_link: "How Your Payment Is Guaranteed",
  policy_4_title: "Secure Payments",
  policy_4_text: "Shop confidently with secure payments that protect your information!",
  policy_4_link: "Support Now",

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
  footer_newsletter_text: "Subscribe to our newsletter for the latest news, recipes and product updates!",
  footer_thanks_heading: "Thank You For Choosing Us!",
  footer_thanks_text: "We appreciate your support and are dedicated to providing you with the best products and service. We look forward to serving you again!",

  popup_heading: "Newsletter",
  popup_text: "Be the first to know about new arrivals, recipes and store news, sent straight to your inbox.",
};

const SIMMER_IMAGES = {
  banner_image_1: `${A}/hero-1.jpg`,
  banner_image_2: `${A}/hero-2.jpg`,
  banner_image_3: `${A}/hero-3.jpg`,
  hero_side_image: `${A}/hero-side.jpg`,
  picks_left_1: `${A}/pick-1a.jpg`,
  picks_right_1: `${A}/pick-1b.jpg`,
  picks_left_2: `${A}/pick-2a.jpg`,
  picks_right_2: `${A}/pick-2b.jpg`,
  picks_left_3: `${A}/pick-3a.jpg`,
  picks_right_3: `${A}/pick-3b.jpg`,
  gallery_image_1: `${A}/gallery-1.jpg`,
  gallery_image_2: `${A}/gallery-2.jpg`,
  gallery_image_3: `${A}/gallery-3.jpg`,
  gallery_image_4: `${A}/gallery-4.jpg`,
  gallery_image_5: `${A}/gallery-5.jpg`,
  gallery_image_6: `${A}/gallery-6.jpg`,
  lookbook_image_1: `${A}/look-1.jpg`,
  lookbook_image_2: `${A}/look-2.jpg`,
  lookbook_image_3: `${A}/look-3.jpg`,
  lookbook_image_4: `${A}/look-4.jpg`,
  faq_image: `${A}/faq.jpg`,
  customer_avatar_1: `${A}/avatar-1.jpg`,
  customer_avatar_2: `${A}/avatar-2.jpg`,
  customer_avatar_3: `${A}/avatar-3.jpg`,
  customer_avatar_4: `${A}/avatar-4.jpg`,
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

const BLENDER_COLORS = ["Matte Black", "Brushed Steel", "Cream"];

// title, type, price, compare-at price, colors (null when there is only one variant)
const PRODUCTS = [
  ["Velvet Pro Countertop Blender", "Blenders", 12900, 15900, BLENDER_COLORS],
  ["CrispAir Digital Air Fryer", "Air Fryers", 9900, 11900, null],
  ["Crema Espresso Machine", "Coffee Machines", 24900, 28900, null],
];

const DEMO_PRODUCTS = PRODUCTS.map(([title, type, price, compareAt, sizes], i) => {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `simmer-${i + 1}`,
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
    selected_or_first_available_variant: { id: `simmer-variant-${i + 1}` },
  };
});

const SIZES_BY_ID = Object.fromEntries(PRODUCTS.map((p, i) => [`simmer-${i + 1}`, p[4]]));

const DESCRIPTIONS = {
  "simmer-1": "<p>A countertop blender with a quiet, powerful motor and a thick glass jar that pours cleanly. Six speeds and a pulse setting take you from silky smoothies to chunky salsa, and the stainless blades lift out for easy cleaning.</p><p>A soft-touch dial and a compact base keep it simple to use and easy to leave out on the counter.</p><h3>Details</h3><ul><li>1.5 litre glass jar with pouring spout</li><li>Six speeds plus pulse</li><li>Removable stainless steel blades</li><li>Non-slip feet</li><li>Wipe the base with a damp cloth</li></ul>",
  "simmer-2": "<p>A digital air fryer with a roomy basket for fries, wings, vegetables and reheating leftovers. Simple presets and a clear display make weeknight cooking quick, and the non-stick basket rinses clean in seconds.</p><p>Hot air circulates evenly for a golden, crunchy finish with only a little oil.</p><h3>Details</h3><ul><li>Large non-stick basket</li><li>Eight one-touch presets</li><li>Adjustable time and temperature</li><li>Cool-touch handle</li><li>Basket and tray wash by hand</li></ul>",
  "simmer-3": "<p>An espresso machine with a steady pump, a steam wand for silky milk and a compact body that fits under most cabinets. Pull a rich shot in the morning or a cappuccino in the afternoon, all from your own counter.</p><p>A removable water tank and drip tray make daily care simple.</p><h3>Details</h3><ul><li>Single and double shot filters</li><li>Steam wand for milk</li><li>Removable water tank</li><li>Cup warming top plate</li><li>Descale regularly, as the manual explains</li></ul>",
};

const plainText = (html) => html.replace(/<\/[^>]+>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const DEMO_ARTICLES = [];

const link = (title, url = "#", links) => ({ title, url, ...(links ? { links } : {}) });

const DEMO_NAV = [
  { ...link("Home", "/"), active: true },
  link("Collections", "/collections", [
    link("Best Sellers", "/collections/all"),
    link("New Arrivals", "/collections/all"),
    link("Shop All", "/collections/all"),
    link("Blend", "/collections/blenders", [
      link("Countertop Blenders", "/collections/blenders"),
      link("Smoothie Making", "/collections/blenders"),
    ]),
    link("Fry", "/collections/air-fryers", [
      link("Air Fryers", "/collections/air-fryers"),
      link("Crispy Snacks", "/collections/air-fryers"),
    ]),
    link("Brew", "/collections/coffee-machines", [
      link("Espresso Machines", "/collections/coffee-machines"),
      link("Morning Coffee", "/collections/coffee-machines"),
    ]),
  ]),
  link("Products", "/collections/all", [
    link("Shop Our Products", "/collections/all", DEMO_PRODUCTS.map((p) => link(p.title, p.url))),
    link("Shop By Use", "/collections/all", [
      link("Blend", "/collections/blenders"),
      link("Fry", "/collections/air-fryers"),
      link("Brew", "/collections/coffee-machines"),
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
    link("Recipes", "/blogs/news"),
    link("Kitchen Guides", "/blogs/news"),
  ]),
];

const value = (label, count, param) => ({ label, value: label, count, param_name: param, active: false });

/** Same shape as Shopify's `collection.filters`. */
const filtersFor = (products) => {
  const has = (type) => products.filter((p) => p.type === type).length;
  return [
    { type: "list", label: "Availability", url_to_remove: "#", values: [value("In stock", products.length, "filter.v.availability"), value("Out of stock", 0, "filter.v.availability")] },
    { type: "price_range", label: "Price", url_to_remove: "#", range_max: 28900, min_value: { param_name: "filter.v.price.gte" }, max_value: { param_name: "filter.v.price.lte" } },
    {
      type: "list",
      presentation: "swatch",
      label: "Color",
      url_to_remove: "#",
      values: [
        { ...value("Matte Black", has("Blenders") + has("Air Fryers"), "filter.v.option.color"), swatch: { color: "#262626" } },
        { ...value("Brushed Steel", has("Blenders") + has("Coffee Machines"), "filter.v.option.color"), swatch: { color: "#b9bcc0" } },
        { ...value("Cream", has("Blenders"), "filter.v.option.color"), swatch: { color: "#ece5d6" } },
      ],
    },
    {
      type: "list",
      label: "Product Type",
      url_to_remove: "#",
      values: [value("Blenders", has("Blenders"), "filter.p.product_type"), value("Air Fryers", has("Air Fryers"), "filter.p.product_type"), value("Coffee Machines", has("Coffee Machines"), "filter.p.product_type")],
    },
  ];
};

const DEMO_COLLECTION = {
  title: "All Products",
  url: "/collections/all",
  description: "<p>Three appliances for the kitchen you use every day: a quiet countertop blender, a roomy digital air fryer and a compact espresso machine. Each one is chosen for how simple it is to use and how well it holds up to real cooking.</p><p>Everything here works together and looks good left out on the counter, ready for the next meal, whatever you happen to be making this week.</p>",
  all_tags: ["Air Fryers", "Blenders", "Coffee", "Espresso", "Kitchen", "Smoothies"],
  sort_by: "manual",
  sort_options: [
    { value: "manual", name: "Featured" },
    { value: "best-selling", name: "Best selling" },
    { value: "title-ascending", name: "Alphabetically, A-Z" },
    { value: "price-ascending", name: "Price, low to high" },
    { value: "price-descending", name: "Price, high to low" },
  ],
};

const icon = (paths) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

/** Category strip icons in the header (the live store shows each collection's own picture). */
const ICONS = {
  blenders: icon('<path d="M7 3h10l-1.5 11h-7z"/><path d="M8.5 14h7l1 7h-9z"/><path d="M12 17.5h.01"/><path d="M17 5h2v5h-2.6"/>'),
  "air-fryers": icon('<rect x="5" y="3" width="14" height="18" rx="4"/><path d="M8 13h8v5H8z"/><circle cx="12" cy="8" r="2"/>'),
  "coffee-machines": icon('<path d="M5 3h14v5H5z"/><path d="M7 8v9h10V8"/><path d="M9.5 13h5v3h-5z"/><path d="M5 21h14"/>'),
  smoothies: icon('<path d="M7 7h10l-1.4 14H8.4z"/><path d="M12 7l2-4"/><path d="M7.5 11h9"/>'),
  snacks: icon('<path d="M4 11h16l-2 9H6z"/><path d="M8 11 7 4M12 11V3M16 11l1-7"/>'),
  coffee: icon('<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 3c-1 1.5 1 2 0 3.500M12.5 3c-1 1.5 1 2 0 3.500"/>'),
  all: icon('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
  gift: icon('<path d="M4 10h16v10H4z"/><path d="M3 7h18v3H3zM12 7v13"/><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>'),
};

const DEMO_COLLECTION_LIST = [
  ["Blenders", "blenders", "pick-1a"],
  ["Air Fryers", "air-fryers", "pick-2a"],
  ["Coffee Machines", "coffee-machines", "pick-3a"],
].map(([title, handle, picture]) => ({ title, handle, url: `/collections/${handle}`, products_count: 1, featured_image: `${A}/${picture}.jpg`, icon: ICONS[handle] }));

/** The header's category strip in the preview: the three collections plus ways to shop them. */
const DEMO_CATEGORY_STRIP = [
  ...DEMO_COLLECTION_LIST,
  { title: "Smoothies", handle: "smoothies", url: "/collections/blenders", icon: ICONS.smoothies },
  { title: "Crispy Snacks", handle: "snacks", url: "/collections/air-fryers", icon: ICONS.snacks },
  { title: "Morning Coffee", handle: "coffee", url: "/collections/coffee-machines", icon: ICONS.coffee },
  { title: "Shop All", handle: "shop-all", url: "/collections/all", icon: ICONS.all },
  { title: "Gift Ideas", handle: "gifts", url: "/collections/all", icon: ICONS.gift },
];

const link_list = (items) => items.map(([title, url]) => link(title, url));

const payBadge = (label) =>
  `<span style="display:inline-grid;place-items:center;width:38px;height:24px;border:1px solid #e3e4ea;border-radius:3px;background:#fff;color:#1f2a44;font:700 8px/1 sans-serif">${label}</span>`;

/**
 * Menus and payment badges for any Simmer preview: these come from the merchant's Shopify settings
 * on the live store, which a preview cannot read.
 */
export const SIMMER_PREVIEW_CHROME = {
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

const skuFor = (id, part = 0) => `SM-${id.split("-")[1]}0${part}`;

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
  var KEY = "sm-preview-cart";
  var CATALOG = ${JSON.stringify(CATALOG)};
  var PAGES = /^\\/$|^\\/collections(\\/[^/]+)?$|^\\/products\\/[^/]+$|^\\/pages\\/(about|contact|faq)$/;
  var sm = window.__sm;
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
  if (sm) {
    sm.api.cart = function () { return Promise.resolve(cart()); };
    sm.api.add = function (id, quantity) {
      if (!find(id)) return Promise.reject(new Error("This item is not in the sample store."));
      var items = lines(), hit = items.filter(function (l) { return String(l.id) === String(id); })[0];
      if (hit) hit.quantity += quantity || 1; else items.push({ id: id, quantity: quantity || 1 });
      save(items);
      return Promise.resolve(cart());
    };
    sm.api.change = function (line, quantity) {
      var items = lines();
      if (quantity > 0) items[line - 1].quantity = quantity; else items.splice(line - 1, 1);
      save(items);
      return Promise.resolve(cart());
    };
    sm.api.product = function (url) {
      var product = CATALOG.filter(function (p) { return p.url === url; })[0];
      return product ? Promise.resolve(product) : Promise.reject(new Error("Not in the sample store."));
    };
    sm.api.buy = function () { sm.toast("Checkout opens on your live store."); };
    sm.api.cart().then(function (c) { document.querySelectorAll("[data-sm-cart-count]").forEach(function (el) { el.textContent = c.item_count; }); });
  }
  function note(message) { if (sm) sm.toast(message); }
  // The app's iframe sandbox has no allow-forms, so a submit event never fires: read the button click.
  document.addEventListener("click", function (event) {
    if (!event.target.closest) return;
    if (event.target.closest("[data-sm-open], [data-sm-quick], [data-sm-add], [data-sm-wish], [data-sm-line], [data-sm-close], [data-sm-zoom], [data-sm-play], [data-sm-cats], [data-sm-zoom-prev], [data-sm-zoom-next]")) return;
    if (event.target.closest("[data-sm-video]")) { note("Your video plays here on the live store."); return; }
    if (event.target.closest("[data-sm-demo-buy]")) { note("Checkout opens on your live store."); return; }
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
      if (a.classList.contains("sm-cl__reset")) note("Filters and sorting work on your live store.");
      return;
    }
    if (PAGES.test(href)) window.parent.postMessage({ type: "SIMMER_PREVIEW_NAVIGATE", href: href }, "*");
    else note("This page opens on your live store.");
  });
  document.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches("[data-sm-autosubmit], [data-sm-sort], [data-sm-range]")) note("Filters and sorting work on your live store.");
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

/** Store-level home data for the Simmer template demo and preview. */
export function buildSimmerHomeData(collectionHandle) {
  return {
    text: { ...SIMMER_TEXT },
    images: { ...SIMMER_IMAGES },
    demo_products: DEMO_PRODUCTS,
    demo_articles: DEMO_ARTICLES,
    demo_collection: demoCollection(collectionHandle),
    demo_collection_list: DEMO_COLLECTION_LIST,
    demo_category_strip: DEMO_CATEGORY_STRIP,
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
export function buildSimmerDemoProduct(handle) {
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
export function buildSimmerDemoProductExtras(handle) {
  const p = DEMO_PRODUCTS.find((item) => item.handle === handle) || DEMO_PRODUCTS[0];
  const sizes = SIZES_BY_ID[p.id];
  const tags = [p.type, "Kitchen", "Appliances"];
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
    options_with_values: [{ name: "Color", values: sizes, selected_value: variants[0].title }],
  };
}

/**
 * Where a link inside the sample preview goes. Returns the home view, a product, or an inner page
 * shown in place of the home view; null for a page the preview does not have.
 */
export function resolveSimmerPreviewLink(href) {
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

/** Product cards for the Simmer demo, in the dashboard product shape the preview maps from. */
export function buildSimmerDemoGridProducts() {
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

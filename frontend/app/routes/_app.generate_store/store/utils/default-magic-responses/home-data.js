/**
 * Default home page copy + images for preview.
 * `SINGLE_HOME_BY_CATEGORY` and `MULTI_HOME_BY_CATEGORY` each hold full `{ images, text }` per store category.
 */

/** @type {Record<string, string>} */
export const CATEGORY_DISPLAY = {
    health_beauty: "Health & Beauty",
    fashion: "Fashion",
    home_kitchen: "Home & Kitchen",
    kids_toys: "Kids & Toys",
    car_accessories: "Car Accessories",
    general: "General"
};

export const STORE_CATEGORY_KEYS = Object.keys(CATEGORY_DISPLAY);

/**
 * @param {string | null | undefined} category
 * @returns {keyof typeof CATEGORY_DISPLAY}
 */
export function normalizeHomeDataCategory(category) {
    const c = String(category ?? "general")
        .trim()
        .toLowerCase()
        .replace(/-/g, "_");
    if (c in CATEGORY_DISPLAY) return /** @type {keyof typeof CATEGORY_DISPLAY} */ (c);
    return "general";
}

/** Single-product: shared default image URLs (each category also has `images` in `SINGLE_HOME_BY_CATEGORY` to replace). */
const SINGLE_HOME_IMAGES_KIDS_TOYS = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};

const SINGLE_HOME_IMAGES_GENERAL = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    creative_image:
        "",
    product_base_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};

const SINGLE_HOME_IMAGES_FASHION = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_base_image:
        "",    
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};

const SINGLE_HOME_IMAGES_HEALTH_BEAUTY = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    creative_image:
        "",
    product_base_image:
        "",  
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};

const SINGLE_HOME_IMAGES_HOME_KITCHEN = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    creative_image:
        "",
    product_base_image:
        "",  
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};

const SINGLE_HOME_IMAGES_CAR_ACCESSORIES = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    creative_image:
        "",
    product_base_image:
        "",  
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        ""
};



/** Multi-product: shared default image URLs (each category also has `images` in `MULTI_HOME_BY_CATEGORY`). */
const MULTI_HOME_IMAGES_FASHION = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""

};

const MULTI_HOME_IMAGES_KIDS_TOYS = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""
};

const MULTI_HOME_IMAGES_GENERAL = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""
};

const MULTI_HOME_IMAGES_HEALTH_BEAUTY = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""
};

const MULTI_HOME_IMAGES_HOME_KITCHEN = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""
};

const MULTI_HOME_IMAGES_CAR_ACCESSORIES = {
    banner_image_1:
        "",
    banner_image_2:
        "",
    banner_image_3:
        "",
    feature_image_1:
        "",
    feature_image_2:
        "",
    feature_image_3:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
    product_impact_image_1:
        "",
    product_impact_image_2:
        "",
    product_impact_image_3:
        "",
    star_image:
        ""
};

/** Single-product home preview: full `{ images, text }` per store category (edit URLs or copy freely). */
export const SINGLE_HOME_BY_CATEGORY = {
    kids_toys: {
        images: { ...SINGLE_HOME_IMAGES_KIDS_TOYS },
        text: {
            banner_heading: "Snuggly Bunny",
        banner_eyebrow: "Soft, cute, and cuddly playtime!",
        image_with_text_description:
        "Our extremely soft and fluffy plush bunny toy transforms bedtime into an exciting adventure. Perfect for children aged 1-10, it promotes emotional growth awareness while sparking their imagination with adorable features. Made from safe, non-toxic materials, this pal is ideal for both home and travel play.",
        image_with_text_heading: "Discover Cuddly Fun",
        image_with_text_subheading: "Soft & Huggable",
        feature_section_heading: "Why Kids Love It",
        feature_desc_1: "Encourages creative storytelling with cute and cuddly themes.",
        feature_desc_2: "Provides soothing comfort and joy through hands-on fun.",
        feature_desc_3: "Made with child-safe, non-toxic materials for worry-free play.",
        feature_desc_4: "Built to withstand energetic hugs for long-lasting use.",
        feature_desc_5: "Lightweight and portable for on-the-go snuggles.",
        feature_desc_6: "Combines extreme softness and joy for a captivating experience.",
        feature_name_1: "Imaginative Play",
        feature_name_2: "Soothing Comfort",
        feature_name_3: "Safe & Non-Toxic",
        feature_name_4: "Durable Quality",
        feature_name_5: "Portable Design",
        feature_name_6: "Uniquely Soft",
        highlight_banner_section_description:
        "Join the fun and make every day a playdate. Shop now for the ultimate kids’ cuddly toy set!",
        highlight_banner_section_heading: "Get Your Child Excited About New Friends!",
        highlight_banner_section_subheading: "Start Cuddling Today",
        marquee_text_1: "Hug",
        marquee_text_2: "Play",
        marquee_text_3: "Snuggle",
        punchy_poetic_headline: "Transform Playtime into Cuddly Adventures!",
        why_choose_us_heading: "Why Choose Our Bunny?",
        why_choose_us_reason_1_description:
        "Helps children feel secure and happy through interactive play, reducing anxiety during bedtime routines.",
        why_choose_us_reason_1_heading: "Comforting & Engaging",
        why_choose_us_reason_2_description:
        "Made from high-quality, non-toxic materials that are safe for children and built to last.",
        why_choose_us_reason_2_heading: "Safe & Durable",
        why_choose_us_reason_3_description:
        "Features adorable designs of fluffy little bunnies, capturing children’s imagination.",
        why_choose_us_reason_3_heading: "Cute & Unique",
        why_choose_us_reason_4_description:
        "Ideal for home, travel, or daycare use to promote healthy habits.",
        why_choose_us_reason_4_heading: "Perfect for All Settings",
        faq_answer_1:
        "Absolutely! Made from non-toxic, child-safe materials, it's designed for kids aged 1-10.",
        faq_answer_2:
        "Yes, the toy is easy to clean with a damp cloth or mild soap, keeping it hygienic for repeated use.",
        faq_answer_3:
        "It encourages children to explore emotional connections and empathy through realistic and imaginative pretend play.",
        faq_question_1: "Is this toy safe for children aged 1-10?",
        faq_question_2: "Can I clean the toy easily?",
        faq_question_3: "How does this toy promote empathy?",
        customer_name_1: "John Smith",
        customer_name_2: "Jane Doe",
        customer_name_3: "Emily Johnson",
        customer_name_4: "Michael Brown",
        customer_name_5: "Olivia Davis",
        customer_review_1: "This is a soft bunny! I love it.",
        customer_review_2: "I love the soft feel of the plushie! It lasts all day long.",
        customer_review_3: "The bunny is beautiful and the toy is perfect for everyday snuggles.",
        customer_review_4: "The plushie is long-lasting and comforting. I love the way it feels in my arms.",
        customer_review_5: "The soft bunny toy set is a great value for the price. I love the way it looks."
        }
    },
    general: {
        images: { ...SINGLE_HOME_IMAGES_GENERAL },
        text: {
        banner_heading: "Smart Security, Simplified",
        banner_eyebrow: "Keyless protection you can trust",
        image_with_text_description:
        "Experience keyless freedom built for security, speed, and durability. Whether you are locking your gym bag or securing an outdoor gate, we provide instant fingerprint recognition and a flawless checkout from cart to delivery.",
        image_with_text_heading: "Secure Your Valuables",
        image_with_text_subheading: "Tough & waterproof",
        feature_section_heading: "Why choose our locks",
        feature_desc_1: "Instant fingerprint unlocking and bluetooth access.",
        feature_desc_2: "Waterproof durability for outdoor usage.",
        feature_desc_3: "USB rechargeable battery with long lifespan.",
        feature_desc_4: "Share access with family using our simple phone app.",
        feature_desc_5: "Stores multiple different fingerprints.",
        feature_desc_6: "Designed to secure your lockers, bicycles, and outdoor gates.",
        feature_name_1: "Quick Unlock",
        feature_name_2: "Weather Resistance",
        feature_name_3: "Long Battery",
        feature_name_4: "App Control",
        feature_name_5: "Biometric Memory",
        feature_name_6: "Universal Fit",
        highlight_banner_section_description:
        "Ditch your keys for smart padlocks and a checkout experience designed around you.",
        highlight_banner_section_heading: "Upgrade your daily security",
        highlight_banner_section_subheading: "Shop smart locks",
        marquee_text_1: "Secure",
        marquee_text_2: "Protect",
        marquee_text_3: "Unlock",
        punchy_poetic_headline: "Smart locks for every bag and every gate",
        why_choose_us_heading: "Why buy our locks?",
        why_choose_us_reason_1_description: "We deliver advanced keyless security and rapid support every time.",
        why_choose_us_reason_1_heading: "Biometric Accuracy",
        why_choose_us_reason_2_description: "Fast and secure shipping delivered worldwide.",
        why_choose_us_reason_2_heading: "Reliable Shipping",
        why_choose_us_reason_3_description: "Customer service that responds when you call.",
        why_choose_us_reason_3_heading: "Always ready support",
        why_choose_us_reason_4_description: "Premium waterproof technology at prices you can afford.",
        why_choose_us_reason_4_heading: "Unbeatable Value",
        faq_answer_1: "Yes. The padlocks are fully waterproof for safe outdoor use.",
        faq_answer_2: "It holds up to fifteen distinct fingerprints for easy shared family access.",
        faq_answer_3: "You can easily charge the lock using the provided universal USB charging cable inside.",
        faq_question_1: "Is the smart lock waterproof?",
        faq_question_2: "How many fingerprints are supported?",
        faq_question_3: "How do I recharge the smart lock battery?",
        customer_review_1: "Reads my fingerprint instantly. Great battery and design.",
        customer_review_2: "Never losing my keys again. I highly recommend it.",
        customer_review_3: "Extremely durable and the bluetooth app works flawlessly.",
        customer_review_4: "Perfect for my locker. Setup was extremely easy.",
        customer_review_5: "Five stars. Heavy duty padlock with a great app."
        }
    },
    fashion: {
        images: { ...SINGLE_HOME_IMAGES_FASHION },
        text: {
        banner_heading: "Classic Flannel Comfort",
        banner_eyebrow: "Warm & rugged shirts for every day",
        image_with_text_description:
            "From cozy mornings to chilly evenings, our flannels are crafted for warmth, durability, and versatility. Layer effortlessly, enjoy soft cotton, and wear shirts that stay comfortable from outdoor trails to casual weekends.",
        image_with_text_heading: "Warmth That Fits Your Life",
        image_with_text_subheading: "Weather-ready essentials",
        feature_section_heading: "Designed for everyday wear",
        feature_desc_1: "Classic cuts that fit without fuss.",
        feature_desc_2: "Cotton selected for warmth and durability.",
        feature_desc_3: "Easy care so shirts stay in rotation.",
        feature_desc_4: "Classic plaids for effortless pairing.",
        feature_desc_5: "Cozy flannels to refresh your closet.",
        feature_desc_6: "Softness that elevates everyday looks.",
        feature_name_1: "Classic fit",
        feature_name_2: "Warm cotton",
        feature_name_3: "Easy care",
        feature_name_4: "Layer & wear",
        feature_name_5: "Rich colors",
        feature_name_6: "Corduroy details",
        highlight_banner_section_description:
            "Find a flannel you reach for every week—cozy layers, classic patterns, and durable cotton that pull it all together.",
        highlight_banner_section_heading: "Layer With Comfort",
        highlight_banner_section_subheading: "Warm flannels in stock",
        marquee_text_1: "Warmth",
        marquee_text_2: "Comfort",
        marquee_text_3: "Durability",
        punchy_poetic_headline: "Upgrade your everyday style with flannels you will wear on repeat",
        why_choose_us_heading: "Why flannel shoppers choose us",
        why_choose_us_reason_1_description: "Clear sizing and measurements to reduce guesswork.",
        why_choose_us_reason_1_heading: "Perfect fit",
        why_choose_us_reason_2_description: "Flannels designed to keep warm across seasons.",
        why_choose_us_reason_2_heading: "Layered style",
        why_choose_us_reason_3_description: "Durable cotton that holds its shape.",
        why_choose_us_reason_3_heading: "Built to last",
        why_choose_us_reason_4_description: "Classic-plaid without sacrificing comfort.",
        why_choose_us_reason_4_heading: "Cozy & wearable",
        faq_answer_1: "Refer to the size chart on the product page and compare to a favorite flannel you own.",
        faq_answer_2: "Care instructions are on the label; our flannels are machine washable unless noted.",
        faq_answer_3: "Yes—use the returns portal within the policy window if the size is not right.",
        faq_question_1: "How do I choose a size?",
        faq_question_2: "How should I care for these flannels?",
        faq_question_3: "Can I exchange for another size?",
        customer_review_1: "Cotton feels premium and the fit is true to the chart.",
        customer_review_2: "Love the warmth—wore it three times already this month.",
        customer_review_3: "Great flannel shirt. Photos matched what arrived.",
        customer_review_4: "Warm and comfortable—exactly what I wanted.",
        customer_review_5: "Fast shipping and the plaid is gorgeous in person."
        }
    },
    health_beauty: {
        images: { ...SINGLE_HOME_IMAGES_HEALTH_BEAUTY },
        text: {
        banner_heading: "Soft Glossy Lips",
        banner_eyebrow: "Nourishing daily lip essentials",
        image_with_text_description:
            "Balms developed to deliver healthy-looking lips and effortless shine. Whether you are focused on hydration, tint, or a glossy daily finish, our balms emphasize soothing ingredients, buttery textures, and softness you can feel.",
        image_with_text_heading: "Moisture That Melts Into Your Lips",
        image_with_text_subheading: "Vegan-friendly formulas",
        feature_section_heading: "What makes our buttery balms shine",
        feature_desc_1: "Soothing butters for visible hydration without stickiness.",
        feature_desc_2: "Formulas that melt perfectly—no sticky residue.",
        feature_desc_3: "Subtle flavors for pleasant application.",
        feature_desc_4: "Tint-friendly shades that fit day and night.",
        feature_desc_5: "Tubes designed for easy application.",
        feature_desc_6: "Cruelty-free ingredients you can trust.",
        feature_name_1: "Deep moisture",
        feature_name_2: "Smooth finish",
        feature_name_3: "Vegan-friendly",
        feature_name_4: "Sheer color",
        feature_name_5: "Travel tube",
        feature_name_6: "Cruelty-free",
        highlight_banner_section_description:
            "Upgrade your routine with balms that protect your delicate lips and your schedule—instant gloss, smarter care.",
        highlight_banner_section_heading: "Your Softest Lips, Daily",
        highlight_banner_section_subheading: "Hydration meets color",
        marquee_text_1: "Shine",
        marquee_text_2: "Soothe",
        marquee_text_3: "Nourish",
        punchy_poetic_headline: "Softness starts with moisture and finishes with shine",
        why_choose_us_heading: "Why customers trust our lip balms",
        why_choose_us_reason_1_description: "We prioritize soothing ingredients and deep hydration.",
        why_choose_us_reason_1_heading: "Clean formulas",
        why_choose_us_reason_2_description: "Balms crafted for daily wear and instant relief.",
        why_choose_us_reason_2_heading: "Lasting comfort",
        why_choose_us_reason_3_description: "Tinted options for a range of skin tones.",
        why_choose_us_reason_3_heading: "Sheer shades",
        why_choose_us_reason_4_description: "Formulas to help you achieve the perfect pout.",
        why_choose_us_reason_4_heading: "Buttery finish",
        faq_answer_1: "Yes—check the product page for full flavor details and tint guides.",
        faq_answer_2: "These balms are perfect for daily use; apply whenever lips feel dry.",
        faq_answer_3: "Refer to the returns policy if a shade is not flattering on your lips.",
        faq_question_1: "Are flavor options listed?",
        faq_question_2: "How often should I apply this balm?",
        faq_question_3: "What if I dislike it?",
        customer_review_1: "My lips feel softer after one day—no stickiness.",
        customer_review_2: "Buttery texture and looks beautiful alone.",
        customer_review_3: "Finally a balm that is not sticky. Huge win.",
        customer_review_4: "Chapped lips saved in my house.",
        customer_review_5: "Will repurchase—noticeable difference in softness."
        }
    },
    home_kitchen: {
        images: { ...SINGLE_HOME_IMAGES_HOME_KITCHEN },
        text: {
        banner_heading: "Organize, Display, Simplify",
        banner_eyebrow: "Display shelves that earn living space",
        image_with_text_description:
            "From storing novels to displaying decor, our home and living picks focus on stability, easy assembly, and smart design. Upgrade the rooms you use every day—without crowding your floors with furniture you will never love.",
        image_with_text_heading: "Built for Real Homes",
        image_with_text_subheading: "Sturdy & practical",
        feature_section_heading: "Why home owners love these shelves",
        feature_desc_1: "Heavy-duty materials for everyday holding.",
        feature_desc_2: "Durable and smooth surfaces for easy cleaning.",
        feature_desc_3: "Adjustable shelving that stays versatile.",
        feature_desc_4: "Sizes suited for small and large apartments.",
        feature_desc_5: "Space-saving designs for tidy rooms.",
        feature_desc_6: "Classic styles that match any bedroom.",
        feature_name_1: "Load capacity",
        feature_name_2: "Easy cleaning",
        feature_name_3: "Smart levels",
        feature_name_4: "Right sizing",
        feature_name_5: "Smart storage",
        feature_name_6: "Timeless look",
        highlight_banner_section_description:
            "Make room organization smoother with shelves and bookcases that stand up to daily use—and look good doing it.",
        highlight_banner_section_heading: "Upgrade Your Living Spaces",
        highlight_banner_section_subheading: "Decorate with confidence",
        marquee_text_1: "Store",
        marquee_text_2: "Style",
        marquee_text_3: "Display",
        punchy_poetic_headline: "Better shelves for items you will actually show",
        why_choose_us_heading: "Why choose our furniture collection",
        why_choose_us_reason_1_description: "Materials chosen for high stability and long life.",
        why_choose_us_reason_1_heading: "Built to last",
        why_choose_us_reason_2_description: "Surfaces designed to resist dust and wipe clean.",
        why_choose_us_reason_2_heading: "Less dusting",
        why_choose_us_reason_3_description: "Sizes that fit real books and real families.",
        why_choose_us_reason_3_heading: "Practical shapes",
        why_choose_us_reason_4_description: "Thoughtful details that speed up setup.",
        why_choose_us_reason_4_heading: "Time saved",
        faq_answer_1: "Yes—setup instructions are listed; most items are assembly required unless noted.",
        faq_answer_2: "Use dry to damp cloths for cleaning; avoid chemicals for best shining.",
        faq_answer_3: "Dimensions and capacities are listed on each product page.",
        faq_question_1: "Are these assembly required?",
        faq_question_2: "What cleaning methods should I use?",
        faq_question_3: "Will this fit my corners?",
        customer_review_1: "Stands evenly—my books finally stopped slipping.",
        customer_review_2: "Solid weight on the floor. Feels professional.",
        customer_review_3: "Builds up fast. Worth the upgrade.",
        customer_review_4: "Great size for paperback novels for home.",
        customer_review_5: "Looks great in the living and holds even better."
        }
    },
    car_accessories: {
        images: { ...SINGLE_HOME_IMAGES_CAR_ACCESSORIES },
        text: {
        banner_heading: "Drive Safer",
        banner_eyebrow: "Prepare, protect, and secure your ride",
        image_with_text_description:
        "From window breakers to seatbelt cutters, our safety accessories are built for daily commutes and road trips alike. Focus on reliable mountings, durable materials, and designs that keep essentials within reach—without cluttering up your center console.",
        image_with_text_heading: "Built for Your Safety",
        image_with_text_subheading: "Reliable & durable",
        feature_section_heading: "Why drivers choose these tools",
        feature_desc_1: "Sharp blades that cut seatbelts in an emergency.",
        feature_desc_2: "Tungsten steel to shatter windows.",
        feature_desc_3: "Quick access in any crisis.",
        feature_desc_4: "Compact designs that store easily.",
        feature_desc_5: "Bright colors for easy visual locating.",
        feature_desc_6: "Vital protection that fits all vehicles.",
        feature_name_1: "Seatbelt cutter",
        feature_name_2: "Window breaker",
        feature_name_3: "Fast access",
        feature_name_4: "Compact size",
        feature_name_5: "High visibility",
        feature_name_6: "Universal fit",
        highlight_banner_section_description:
        "Safety upgrades make every drive calmer—faster reactions, better preparedness, and tools that save lives.",
        highlight_banner_section_heading: "Prepare Your Cabin",
        highlight_banner_section_subheading: "Safety meets control",
        marquee_text_1: "Prepare",
        marquee_text_2: "Protect",
        marquee_text_3: "Escape",
        punchy_poetic_headline: "A safer cabin and a calmer commute",
        why_choose_us_heading: "Why motorists shop here",
        why_choose_us_reason_1_description: "Clear instructions and safety notes on product pages.",
        why_choose_us_reason_1_heading: "Clear details",
        why_choose_us_reason_2_description: "Hammers and cutters tested for reliable performance.",
        why_choose_us_reason_2_heading: "Emergency-ready",
        why_choose_us_reason_3_description: "Durable builds that resist daily wear.",
        why_choose_us_reason_3_heading: "Long-lasting",
        why_choose_us_reason_4_description: "Designs that minimize panic and maximize access.",
        why_choose_us_reason_4_heading: "Driver focused",
        faq_answer_1: "Check the product section for storage recommendations and mount types.",
        faq_answer_2: "Keep within arm reach on center consoles for quickest access.",
        faq_answer_3: "Refer to the warranty details on the product page for coverage terms.",
        faq_question_1: "Where should I keep it?",
        faq_question_2: "How do I ensure quick access?",
        faq_question_3: "Is there a warranty?",
        customer_review_1: "Very sharp on tough belts—finally a cutter that works.",
        customer_review_2: "Mounting took two minutes. Super solid.",
        customer_review_3: "Keeps my family feeling prepared on the road.",
        customer_review_4: "Heat did not warp it over summer—impressed.",
        customer_review_5: "Bright color and everything stays within reach."
        }
    }
};

/** Multi-product: merge patches on top of fashion base. Empty patch = fashion. */
/** Multi-product home preview: full `{ images, text }` per store category (edit URLs or copy freely). */
export const MULTI_HOME_BY_CATEGORY = {
    fashion: {
        images: { ...MULTI_HOME_IMAGES_FASHION },
        text: {
        banner_heading_1: "Comfortable Knitwear",
        banner_heading_2: "Stretch Sweatpants",
        banner_heading_3: "Style & Comfort",
        banner_eyebrow_1: "Build Your Outfit Effortlessly",
        banner_eyebrow_2: "Soft, Stretch Fabric",
        banner_eyebrow_3: "Elevate Daily Footwear",
        faq_answer_1:
            "It combines comfortable knitwear, a stylish pant, and casual sneakers for a complete, modern look.",
        faq_answer_2: "Yes, it provides relaxed, stretch-fit pants with durable materials for all-day comfort.",
        faq_answer_3: "Absolutely, its versatile design complements a range of settings for any weekend.",
        faq_question_1: "What makes this sweater and pant set unique?",
        faq_question_2: "Are the sweatpants long-lasting and comfortable?",
        faq_question_3: "Can this look be worn for both relaxing and active weekends?",
        featured_product_headline_1: "Knit Sweaters",
        featured_product_headline_2: "Stretch Pants",
        featured_product_headline_3: "Classic Shoes",
        featured_product_subheadline_1: "Cozy layers to elevate everyday outfits.",
        featured_product_subheadline_2: "Comfortable stretch-fit trousers for a relaxed feel.",
        featured_product_subheadline_3: "All-in-one style and comfort solution.",
        highlight_banner_section_description:
            "Discover our curated looks designed to boost comfort and elevate everyday wardrobes.",
        highlight_banner_section_heading: "Complete Your Look",
        highlight_banner_section_subheading: "Casual sweaters and bottoms in perfect harmony",
        marquee_text_1: "Apparel",
        marquee_text_2: "Footwear",
        marquee_text_3: "Comfort",
        punchy_poetic_headline:
            "Enhance your comfort and style with casual knitwear and sneakers, all in one modern look.",
        star_product_feature_1: "Classic Sweaters",
        star_product_feature_1_desc: "Cozy, breathable crewneck and knit layers for modern men.",
        star_product_feature_2: "Flexible Bottoms",
        star_product_feature_2_desc: "Comfortable corduroy pants with elastic waistbands.",
        star_product_feature_3: "Versatile Kicks",
        star_product_feature_3_desc: "Suitable for gym, street, casual, or weekend wear.",
        star_product_feature_4: "Perfect Fit",
        star_product_feature_4_desc: "Carefully tailored, ideal for daily movement.",
        top_product_punchline_1: "Warm Casual Sweaters",
        top_product_punchline_1_description: "A curated long-sleeve crewneck and knit sweater perfect for daily layering.",
        top_product_punchline_2: "Soft Stretch Pants",
        top_product_punchline_2_description:
            "Long-lasting corduroy trousers with adjustable waistbands for confident wear.",
        top_product_punchline_3: "Everyday Footwear",
        top_product_punchline_3_description: "Complete your look with effortless walkability and modern aesthetics.",
        customer_name_1: "John Smith",
        customer_name_2: "James Doe",
        customer_name_3: "Evan Johnson",
        customer_name_4: "Michael Brown",
        customer_name_5: "Oliver Davis",
        customer_review_1: "This is a great sweater! I love it.",
        customer_review_2: "I love the relaxed fit of the sweatpants! They stay comfortable all day.",
        customer_review_3: "The crewneck is comfortable and the sneakers are perfect for everyday wear.",
        customer_review_4: "The footwear is long-lasting and supportive. I love the way it feels on my feet.",
        customer_review_5: "The sweater and pants combo is a great value for the price. I love the way it fits."
        }
    },
    kids_toys: {
        images: { ...MULTI_HOME_IMAGES_KIDS_TOYS },
        text: {
        banner_heading_1: "Magical Play Tents",
        banner_heading_2: "Portable Soccer Goals",
        banner_heading_3: "Active Toddler Slides",
        banner_eyebrow_1: "Imaginative tents for curious kids",
        banner_eyebrow_2: "Action-packed sports at home",
        banner_eyebrow_3: "Safe sliding parents trust",
        faq_answer_1: "Yes—materials are sized for the age group shown and built for durability.",
        faq_answer_2: "Wipe clean with a damp cloth; avoid harsh chemical cleaners.",
        faq_answer_3: "Each item features an easy setup to spark active play every day.",
        faq_question_1: "Are these items safe for young children?",
        faq_question_2: "How do I clean the equipment?",
        faq_question_3: "Will kids stay active over time?",
        featured_product_headline_1: "Playhouse Tents",
        featured_product_headline_2: "Backyard Soccer Goals",
        featured_product_headline_3: "Toddler Slides",
        featured_product_subheadline_1: "Castles and tents that inspire hours of play.",
        featured_product_subheadline_2: "Nets and frames for active discovery.",
        featured_product_subheadline_3: "Folding slides for energy-filled afternoons.",
        highlight_banner_section_description:
        "Stock up on gear that balances fun, movement, and durability—perfect for yards and everyday play.",
        highlight_banner_section_heading: "Gear That Moves With Them",
        highlight_banner_section_subheading: "Discover top picks for active kids",
        marquee_text_1: "Play",
        marquee_text_2: "Move",
        marquee_text_3: "Score",
        punchy_poetic_headline:
        "Movement in every yard and smiles that last all afternoon and memories after school",
        star_product_feature_1: "Safe Materials",
        star_product_feature_1_desc: "Durable fabrics and rounded edges on kid-friendly designs.",
        star_product_feature_2: "Active Play",
        star_product_feature_2_desc: "Full body and active-movement through backyard play.",
        star_product_feature_3: "Fast Setup",
        star_product_feature_3_desc: "Simple assembly that delights on birthdays and holidays.",
        star_product_feature_4: "Parent Approved",
        star_product_feature_4_desc: "Easy folding with clear instructions included.",
        top_product_punchline_1: "Princess Tent",
        top_product_punchline_1_description: "Fairy castles and accessories for imaginative storylines.",
        top_product_punchline_2: "Soccer Bundle",
        top_product_punchline_2_description: "Foldable nets that grow with your child’s kicks.",
        top_product_punchline_3: "First Slide",
        top_product_punchline_3_description: "Folding slides for backyard adventures and movement.",
        customer_review_1: "Hours of active play—worth every penny.",
        customer_review_2: "Sturdy frames; survived a house full of toddlers.",
        customer_review_3: "My kid asks for this slide every weekend.",
        customer_review_4: "Clear instructions and no missing pieces.",
        customer_review_5: "Neighbors even asked where we bought it."
        }
    },
    general: {
        images: { ...MULTI_HOME_IMAGES_GENERAL },
        text: {
        banner_heading_1: "Magnetic Whiteboards",
        banner_heading_2: "Smart Padlocks",
        banner_heading_3: "Desk Organizers",
        banner_eyebrow_1: "Stain resistant writing surfaces",
        banner_eyebrow_2: "Keyless biometric security locks",
        banner_eyebrow_3: "Wireless charging pen cups",
        faq_answer_1: "Board sizes, battery details, and charger specs are on each page.",
        faq_answer_2: "Fingerprint limits appear at checkout based on your padlock.",
        faq_answer_3: "Reach out via our store contact options for setup questions.",
        faq_question_1: "Where can I see technical details?",
        faq_question_2: "How long does charging take?",
        faq_question_3: "How do I program the smart fingerprint lock?",
        featured_product_headline_1: "Magnetic Whiteboard",
        featured_product_headline_2: "Biometric Padlock",
        featured_product_headline_3: "Charging Organizer",
        featured_product_subheadline_1: "Stain-resistant for home and office.",
        featured_product_subheadline_2: "A keyless upgrade for your lockers.",
        featured_product_subheadline_3: "Fast power—charge phones while working.",
        highlight_banner_section_description:
        "Browse our smart selection with clever tools and gadgets when you need productivity.",
        highlight_banner_section_heading: "Shop Daily Essentials",
        highlight_banner_section_subheading: "Upgrades across your workspace",
        marquee_text_1: "Write",
        marquee_text_2: "Lock",
        marquee_text_3: "Charge",
        punchy_poetic_headline: "Smart gadgets, clean workspaces, and security you can trust",
        star_product_feature_1: "Smooth writing",
        star_product_feature_1_desc: "Boards designed for daily brainstorming.",
        star_product_feature_2: "Instant unlock",
        star_product_feature_2_desc: "Fingerprint and biometric access set easily.",
        star_product_feature_3: "Wireless power",
        star_product_feature_3_desc: "Charging when you need it.",
        star_product_feature_4: "Desk storage",
        star_product_feature_4_desc: "Pens kept organized perfectly.",
        top_product_punchline_1: "Beauty Items",
        top_product_punchline_1_description: "Masks, creams, and brushes that work together.",
        top_product_punchline_2: "Fashion Option",
        top_product_punchline_2_description: "Fashion items that complement each other.",
        top_product_punchline_3: "Kids Entertainment",
        top_product_punchline_3_description: "Kids that can entertain themselves for hours.",
        customer_review_1: "Straightforward writing experience—no staining.",
        customer_review_2: "Fingerprint reader unlocked it perfectly.",
        customer_review_3: "Quick charging from the holder when I was working.",
        customer_review_4: "Whiteboard was clean and wiped off easily.",
        customer_review_5: "I recommend these gadgets to coworkers."
        }
    },
    health_beauty: {
        images: { ...MULTI_HOME_IMAGES_HEALTH_BEAUTY },
        text: {
        banner_heading_1: "Deep Hydration",
        banner_heading_2: "Smooth Skin",
        banner_heading_3: "Deep Cleansing",
        banner_eyebrow_1: "Pore-tightening masks",
        banner_eyebrow_2: "Moisture that fights aging",
        banner_eyebrow_3: "Vibration clears pores",
        faq_answer_1: "Deep cleansing brush works perfectly with our collagen mask and daily moisturizer.",
        faq_answer_2: "Wear the collagen mask overnight and wake up with glowing skin.",
        faq_answer_3: "Use the silicone vibrating brush daily to gently exfoliate before applying the face cream.",
        faq_question_1: "How do products combine?",
        faq_question_2: "How do I use the overnight mask?",
        faq_question_3: "How often should I use the brush?",
        featured_product_headline_1: "Collagen Mask",
        featured_product_headline_2: "Sculpting Cream",
        featured_product_headline_3: "Cleansing Brush",
        featured_product_subheadline_1: "Tightens pores and hydrates overnight instantly.",
        featured_product_subheadline_2: "Deep hydration reduces visible wrinkles.",
        featured_product_subheadline_3: "Gently exfoliates for clearer skin.",
        highlight_banner_section_description:
            "Advanced skincare and cleansing tools with proven results for routines you will actually love.",
        highlight_banner_section_heading: "Cleanse Deep, Hydrate Well",
        highlight_banner_section_subheading: "Results that you can see",
        marquee_text_1: "Cleanse",
        marquee_text_2: "Firm",
        marquee_text_3: "Smooth",
        punchy_poetic_headline: "Deep-cleaning vibrations, creams that fight aging, and masks that truly hydrate",
        star_product_feature_1: "Deep hydration",
        star_product_feature_1_desc: "Hyaluronic acid locks in overnight moisture.",
        star_product_feature_2: "Anti-aging",
        star_product_feature_2_desc: "Peptides smooth away fine lines.",
        star_product_feature_3: "Gentle cleansing",
        star_product_feature_3_desc: "Soft silicone bristles clear pores.",
        star_product_feature_4: "Waterproof design",
        star_product_feature_4_desc: "Perfect for safe use in the shower.",
        top_product_punchline_1: "Deep moisture",
        top_product_punchline_1_description: "Masks that deeply hydrate overnight.",
        top_product_punchline_2: "Age defense",
        top_product_punchline_2_description: "Creams that effectively reduce visible wrinkles.",
        top_product_punchline_3: "Sonic brush",
        top_product_punchline_3_description: "Tools that cleanse your pores completely.",
        customer_review_1: "Pores look much smaller after one use.",
        customer_review_2: "Finally a cleansing brush that does not irritate me.",
        customer_review_3: "Hydration level sold me—no dry patches.",
        customer_review_4: "My wrinkles are fading and my skin feels firmer.",
        customer_review_5: "Will reorder when it empties."
        }
    },
    home_kitchen: {
        images: { ...MULTI_HOME_IMAGES_HOME_KITCHEN },
        text: {
        banner_heading_1: "Sturdy TV Stand",
        banner_heading_2: "Portable Blenders",
        banner_heading_3: "Tiered Plant Stands",
        banner_eyebrow_1: "Strong designs for your home",
        banner_eyebrow_2: "Blend drinks anywhere",
        banner_eyebrow_3: "Display your beautiful plants",
        faq_answer_1: "Simple building steps are in each box; simply wipe wood and metal.",
        faq_answer_2: "Measurements and limits are listed to help you plan your room.",
        faq_answer_3: "Read the quick guide for charging and wash guidance on blenders.",
        faq_question_1: "Are these easily built?",
        faq_question_2: "Will it fit my room?",
        faq_question_3: "How do I clean my blender?",
        featured_product_headline_1: "Wood Stand",
        featured_product_headline_2: "Ninja Blender",
        featured_product_headline_3: "Plant Stand",
        featured_product_subheadline_1: "Strong support and great style every time.",
        featured_product_subheadline_2: "Portable, strong, travel-ready.",
        featured_product_subheadline_3: "Beautiful displays with simple assembly.",
        highlight_banner_section_description:
            "Upgrade the items you use every day—furniture, blenders, and stands that earn their spot.",
        highlight_banner_section_heading: "Your Home, Upgraded",
        highlight_banner_section_subheading: "Durable picks for daily living",
        marquee_text_1: "Decor",
        marquee_text_2: "Blend",
        marquee_text_3: "Grow",
        punchy_poetic_headline: "Strong wood, portable blending, and displays worth waking up for",
        star_product_feature_1: "Sturdy support",
        star_product_feature_1_desc: "Stands that hold heavy items very easily.",
        star_product_feature_2: "Cordless power",
        star_product_feature_2_desc: "Strong blades and easy charging.",
        star_product_feature_3: "Multiple tiers",
        star_product_feature_3_desc: "Shelves built for heavy pots.",
        star_product_feature_4: "Simple setup",
        star_product_feature_4_desc: "Instructions that make building faster.",
        top_product_punchline_1: "Hold & display",
        top_product_punchline_1_description: "From large screens to gaming consoles.",
        top_product_punchline_2: "Smooth drinks",
        top_product_punchline_2_description: "Blenders that crush and mix fast.",
        top_product_punchline_3: "Plant pride",
        top_product_punchline_3_description: "Stands that elevate your indoor garden.",
        customer_review_1: "Wood stand actually holds—rare find.",
        customer_review_2: "Blender does not leak in my bag.",
        customer_review_3: "Living room looks cleaner with this.",
        customer_review_4: "Plants fit perfectly. Very happy.",
        customer_review_5: "Replaced my old broken stands with this."
        }
    },
    car_accessories: {
        images: { ...MULTI_HOME_IMAGES_CAR_ACCESSORIES },
        text: {
        banner_heading_1: "Magnetic Mounts",
        banner_heading_2: "Tire Inflators",
        banner_heading_3: "Breathable Seat Covers",
        banner_eyebrow_1: "Strongest hold for phones",
        banner_eyebrow_2: "Inflate tires instantly",
        banner_eyebrow_3: "Keep seats looking new",
        faq_answer_1: "Magnetic mounts hold large phones and attach easily—check your dashboard.",
        faq_answer_2: "Set the tire inflator to your desired pressure.",
        faq_answer_3: "Breathable seat covers slip seamlessly over your seats.",
        faq_question_1: "Will this mount hold my phone safely?",
        faq_question_2: "How do I pump my tires?",
        faq_question_3: "Are the covers breathable?",
        featured_product_headline_1: "MagSafe Mount",
        featured_product_headline_2: "Air Compressor",
        featured_product_headline_3: "Seat Protectors",
        featured_product_subheadline_1: "Firm grip on rough roads.",
        featured_product_subheadline_2: "Portable pump for fast tire inflation.",
        featured_product_subheadline_3: "Stylish protection for your seats.",
        highlight_banner_section_description:
            "Smart accessories that make every drive safer—strong holds, quick inflators, and covers that protect.",
        highlight_banner_section_heading: "Drive Confidently",
        highlight_banner_section_subheading: "Upgrades for daily miles",
        marquee_text_1: "Mount",
        marquee_text_2: "Inflate",
        marquee_text_3: "Protect",
        punchy_poetic_headline: "Magnetic mounts, portable compressors, and seats that stay pristine",
        star_product_feature_1: "Strong suction",
        star_product_feature_1_desc: "Magnets that secure phones when roads get rough.",
        star_product_feature_2: "Auto shutoff",
        star_product_feature_2_desc: "Compressors designed for precise inflation.",
        star_product_feature_3: "Breathable fabric",
        star_product_feature_3_desc: "Premium materials for everyday comfort.",
        star_product_feature_4: "Universal fit",
        star_product_feature_4_desc: "Covers and mounts for any vehicle.",
        top_product_punchline_1: "Magnetic mount",
        top_product_punchline_1_description: "Secure hold for large phones.",
        top_product_punchline_2: "Tire safety",
        top_product_punchline_2_description: "Portable pumps for fast tire fills.",
        top_product_punchline_3: "Seat defense",
        top_product_punchline_3_description: "Covers and protectors for clean interiors.",
        customer_review_1: "Finally a mount that does not fall on the highway.",
        customer_review_2: "Portable inflator saved our road trip.",
        customer_review_3: "Suction held through summer heat.",
        customer_review_4: "Seat covers upgraded the look of my car.",
        customer_review_5: "Looks great, works better than expected."
        }
    }
};

function buildSingleByCategory() {
    /** @type {Record<string, { images: Record<string, string>; text: Record<string, string> }>} */
    const out = {};
    for (const key of STORE_CATEGORY_KEYS) {
        out[key] = structuredClone(SINGLE_HOME_BY_CATEGORY[key]);
    }
    return out;
}

function buildMultiByCategory() {
    /** @type {Record<string, { images: Record<string, string>; text: Record<string, string> }>} */
    const out = {};
    for (const key of STORE_CATEGORY_KEYS) {
        out[key] = structuredClone(MULTI_HOME_BY_CATEGORY[key]);
    }
    return out;
}

export const SINGLE_HOME_PAGE_BY_CATEGORY = buildSingleByCategory();
export const MULTI_HOME_PAGE_BY_CATEGORY = buildMultiByCategory();

/**
 * Classic prepaid demo images — scene photos per category (not white packshots).
 * Must not reuse COD classic, Velvet cinematic, Sleek, or Vibe demo URLs.
 * Filled from scripts/classic_prepaid_demo_images_manifest.json after generation.
 */
const PREPAID_CLASSIC_HOME_IMAGES_KIDS_TOYS = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_GENERAL = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_FASHION = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_HEALTH_BEAUTY = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_HOME_KITCHEN = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_CAR_ACCESSORIES = {
    banner_image:
        "",
    product_impact_image:
        "",
    feature_image:
        "",
    product_base_image:
        "",
    creative_image:
        "",
    highlight_image:
        "",
    product_image_1:
        "",
    product_image_2:
        "",
    product_image_3:
        "",
};

const PREPAID_CLASSIC_HOME_IMAGES_BY_CATEGORY = {
    kids_toys: PREPAID_CLASSIC_HOME_IMAGES_KIDS_TOYS,
    general: PREPAID_CLASSIC_HOME_IMAGES_GENERAL,
    fashion: PREPAID_CLASSIC_HOME_IMAGES_FASHION,
    health_beauty: PREPAID_CLASSIC_HOME_IMAGES_HEALTH_BEAUTY,
    home_kitchen: PREPAID_CLASSIC_HOME_IMAGES_HOME_KITCHEN,
    car_accessories: PREPAID_CLASSIC_HOME_IMAGES_CAR_ACCESSORIES,
};

/** Light copy for Classic prepaid demos (distinct heroes from COD classic). */
const PREPAID_CLASSIC_TEXT_OVERRIDES = {
    kids_toys: {
        banner_heading: "Soft Felt Activity Cube",
        banner_eyebrow: "Touch, stack, and explore",
        image_with_text_heading: "Play That Softly Teaches",
        image_with_text_subheading: "Quiet, cozy learning",
        punchy_poetic_headline: "Six soft sides of curious play",
        checkout_product_details:
            "A soft felt activity cube with six sides of quiet play. Gentle textures, safe edges, and simple activities for little hands.",
    },
    general: {
        banner_heading: "Bamboo Wireless Charge",
        banner_eyebrow: "Clean desk power",
        image_with_text_heading: "Charge Without the Clutter",
        image_with_text_subheading: "Natural wood, quiet tech",
        punchy_poetic_headline: "Everyday power, simply designed",
        checkout_product_details:
            "A minimal bamboo wireless charger pad. Natural wood finish, quiet charging, and a clean fit for any desk.",
    },
    fashion: {
        banner_heading: "Canvas Weekend Tote",
        banner_eyebrow: "Carry more, stress less",
        image_with_text_heading: "Built for Real Days Out",
        image_with_text_subheading: "Natural canvas, easy leather handles",
        punchy_poetic_headline: "Your go-everywhere weekend bag",
        checkout_product_details:
            "A natural canvas weekend tote with easy leather handles. Room for a day out, light enough to carry all afternoon.",
    },
    health_beauty: {
        banner_heading: "Amber Glass Face Oil",
        banner_eyebrow: "Nightly glow ritual",
        image_with_text_heading: "A Drop of Calm Skin Care",
        image_with_text_subheading: "Protective amber glass",
        punchy_poetic_headline: "Simple oil. Soft skin.",
        checkout_product_details:
            "An amber glass face oil dropper for a simple nightly ritual. Protective glass, a few drops, and soft-looking skin.",
    },
    home_kitchen: {
        banner_heading: "Matte Black Pour-Over Kettle",
        banner_eyebrow: "Precision pour at home",
        image_with_text_heading: "Brew Like You Mean It",
        image_with_text_subheading: "Gooseneck control, everyday ritual",
        punchy_poetic_headline: "Coffee mornings, refined",
        checkout_product_details:
            "A matte black gooseneck pour-over kettle for a steady, precise pour. Built for everyday coffee at home.",
    },
    car_accessories: {
        banner_heading: "Seat Gap Organizer",
        banner_eyebrow: "Catch what falls between",
        image_with_text_heading: "Keep the Cabin Clean",
        image_with_text_subheading: "Soft leather, smart pockets",
        punchy_poetic_headline: "No more lost phones in the seat gap",
        checkout_product_details:
            "A leather seat-gap organizer that catches phones, keys, and coins. Soft finish with pockets that stay within reach.",
    },
};

function buildPrepaidClassicByCategory() {
    /** @type {Record<string, { images: Record<string, string>; text: Record<string, string> }>} */
    const out = {};
    for (const key of STORE_CATEGORY_KEYS) {
        const base = structuredClone(
            SINGLE_HOME_BY_CATEGORY[key] || SINGLE_HOME_BY_CATEGORY.general,
        );
        out[key] = {
            images: {
                ...(PREPAID_CLASSIC_HOME_IMAGES_BY_CATEGORY[key] ||
                    PREPAID_CLASSIC_HOME_IMAGES_GENERAL),
            },
            text: {
                ...base.text,
                ...(PREPAID_CLASSIC_TEXT_OVERRIDES[key] || PREPAID_CLASSIC_TEXT_OVERRIDES.general),
            },
        };
    }
    return out;
}

export const PREPAID_CLASSIC_HOME_PAGE_BY_CATEGORY = buildPrepaidClassicByCategory();

/** Shared cinematic COD single-product demo copy (section keys match cinematic liquids). */
const CINEMATIC_HOME_TEXT_BASE = {
    announcement_1: "Free shipping on every order",
    announcement_2: "Up to 30% off your first order",
    announcement_3: "Easy 30-day returns",
    announcement_4: "Secure checkout",
    announcement_5: "Same-day dispatch before 2pm",
    trust_1_title: "Free Shipping",
    trust_1_line: "Nationwide",
    trust_2_title: "Satisfied",
    trust_2_line: "Customers",
    trust_3_title: "365 Days",
    trust_3_line: "Warranty",
    trust_4_title: "Certified",
    trust_4_line: "Products",
    product_story_eyebrow: "Made for everyday",
    product_story_heading: "Pure Freedom\nEveryday",
    product_story_body:
        "Discover a product built for real days — premium feel, simple use, and a storefront that sells the story.",
    product_story_cta: "Shop Now",
    inspiration_line_1: "Small details.",
    inspiration_line_1_accent: "Big possibilities.",
    inspiration_line_2: "A cinematic homepage layout tuned for conversion.",
    feature_ticker_1: "Premium feel",
    feature_ticker_2: "Everyday ready",
    feature_ticker_3: "Fast delivery",
    feature_ticker_4: "Easy returns",
    feature_ticker_5: "Secure checkout",
    feature_ticker_6: "Support that answers",
    why_shop_heading: "Why Shop With Us?",
    why_1_title: "Designed for real days",
    why_1_text: "Built for the moments you actually use it — not just the photoshoot.",
    why_2_title: "Shipped with care",
    why_2_text: "Every order is packed, tracked, and sent quickly.",
    why_3_title: "Tried, then decided",
    why_3_text: "Live with it for 30 days. If it is not right, send it back.",
    why_4_title: "People, not tickets",
    why_4_text: "Questions about fit, setup, or an order? A real person answers.",
    why_5_title: "Authentic quality",
    why_5_text: "Every unit is checked before it leaves.",
    orbit_eyebrow: "Key features",
    orbit_heading: "Built around the way you move",
    orbit_1_title: "Premium Build",
    orbit_1_text: "Materials and finish that feel intentional.",
    orbit_2_title: "Everyday Comfort",
    orbit_2_text: "Easy to use from the first moment.",
    orbit_3_title: "All-Day Ready",
    orbit_3_text: "Made for work, home, and on the go.",
    orbit_4_title: "Instant Setup",
    orbit_4_text: "Open, connect, and go.",
    orbit_5_title: "Compact Carry",
    orbit_5_text: "Travels light without losing presence.",
    orbit_6_title: "Everyday Ready",
    orbit_6_text: "One product that covers more of your day.",
    review_eyebrow: "Reviews",
    review_heading: "What customers say",
    customer_name_1: "Reviewer Name",
    customer_review_1: "Enter customer review over here",
    customer_name_2: "Reviewer Name",
    customer_review_2: "Enter customer review over here",
    customer_name_3: "Reviewer Name",
    customer_review_3: "Enter customer review over here",
    faq_eyebrow: "FAQs",
    faq_heading: "Questions, Answered",
    faq_1_q: "How fast will my order arrive?",
    faq_1_a: "Most deliveries arrive within 3–5 business days.",
    faq_2_q: "What is your return policy?",
    faq_2_a: "You have 30 days from delivery to try it at home.",
    faq_3_q: "How do I get started?",
    faq_3_a: "Follow the quick-start guide included in the box.",
    faq_4_q: "Is support included?",
    faq_4_a: "Yes — reach out anytime and we typically reply within one business day.",
    faq_5_q: "Can I buy more than one?",
    faq_5_a: "Absolutely. Add as many as you need at checkout.",
    faq_6_q: "How can I get in touch?",
    faq_6_a: "Use the contact page — we typically reply within one business day.",
    sticky_cta: "Shop now",
};

/** Light category-flavored overrides for cinematic / Velvet homepage demos. */
const CINEMATIC_TEXT_OVERRIDES = {
    kids_toys: {
        product_story_eyebrow: "Stack, play, grow",
        product_story_heading: "Rainbow\nArch",
        product_story_body:
            "A wooden rainbow stacking arch framed in soft cinematic light — playful, calm, and made for little hands.",
        inspiration_line_1: "Soft colors.",
        inspiration_line_1_accent: "Big imagination.",
        orbit_heading: "Built for playtime",
    },
    fashion: {
        product_story_eyebrow: "Carry less. Look more.",
        product_story_heading: "Leather\nCrossbody",
        product_story_body:
            "A structured camel crossbody shot like a campaign — clean lines, everyday polish, instant presence.",
        inspiration_line_1: "Soft leather.",
        inspiration_line_1_accent: "Sharp silhouette.",
        orbit_heading: "Built around how you move",
    },
    health_beauty: {
        product_story_eyebrow: "Ritual, elevated",
        product_story_heading: "Roll &\nGlow",
        product_story_body:
            "Ceramic facial roller and serum duo in spa-calm cinematic stillness — clear, premium, conversion-ready.",
        inspiration_line_1: "Small rituals.",
        inspiration_line_1_accent: "Big glow.",
        orbit_heading: "Built for your routine",
    },
    home_kitchen: {
        product_story_eyebrow: "One pot. Many nights.",
        product_story_heading: "Dutch\nOven",
        product_story_body:
            "Matte sage cast-iron enamel framed with warm kitchen depth — useful, beautiful, shoppable.",
        inspiration_line_1: "Quiet tools.",
        inspiration_line_1_accent: "Daily ease.",
        orbit_heading: "Built for the home",
    },
    car_accessories: {
        product_story_eyebrow: "Cabin, elevated",
        product_story_heading: "Ambient\nGlow",
        product_story_body:
            "A minimal LED dashboard strip with bold technical campaign presence — clear product, strong mood.",
        inspiration_line_1: "Road-ready.",
        inspiration_line_1_accent: "Cabin-clear.",
        orbit_heading: "Built for the drive",
    },
    general: {
        product_story_eyebrow: "Light that sells the desk",
        product_story_heading: "Ceramic\nLamp",
        product_story_body:
            "A matte ceramic desk lamp in editorial still-life light — premium presence for a single-product storefront.",
        inspiration_line_1: "Warm glow.",
        inspiration_line_1_accent: "Quiet focus.",
        orbit_heading: "Built to stand out",
    },
};

/** Dedicated cinematic demo images — Velvet homepage heroes (per category). */
const CINEMATIC_HOME_IMAGES_KIDS_TOYS = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_GENERAL = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_FASHION = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_HEALTH_BEAUTY = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_HOME_KITCHEN = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_CAR_ACCESSORIES = {
    banner_image:
        "",
    banner_image_mobile:
        "",
    product_story_image:
        "",
    why_shop_image:
        "",
    circle_feature_image:
        "",
};

const CINEMATIC_HOME_IMAGES_BY_CATEGORY = {
    kids_toys: CINEMATIC_HOME_IMAGES_KIDS_TOYS,
    general: CINEMATIC_HOME_IMAGES_GENERAL,
    fashion: CINEMATIC_HOME_IMAGES_FASHION,
    health_beauty: CINEMATIC_HOME_IMAGES_HEALTH_BEAUTY,
    home_kitchen: CINEMATIC_HOME_IMAGES_HOME_KITCHEN,
    car_accessories: CINEMATIC_HOME_IMAGES_CAR_ACCESSORIES,
};

function buildCinematicSingleByCategory() {
    /** @type {Record<string, { images: Record<string, string>; text: Record<string, string> }>} */
    const out = {};
    for (const key of STORE_CATEGORY_KEYS) {
        out[key] = {
            images: {
                ...(CINEMATIC_HOME_IMAGES_BY_CATEGORY[key] ||
                    CINEMATIC_HOME_IMAGES_GENERAL),
            },
            text: {
                ...CINEMATIC_HOME_TEXT_BASE,
                ...(CINEMATIC_TEXT_OVERRIDES[key] || CINEMATIC_TEXT_OVERRIDES.general),
            },
        };
    }
    return out;
}

export const CINEMATIC_SINGLE_HOME_PAGE_BY_CATEGORY = buildCinematicSingleByCategory();

/* ---------------------------------------------------------------------------
 * Amour (single product, homepage only) — demo copy + images per category.
 * Each category shows its own Amour-only demo product.
 * ------------------------------------------------------------------------- */
const AMOUR_HOME_TEXT_BASE = {
    "hero_eyebrow": "Made to be loved",
    "hero_heading": "Shine every day",
    "hero_cta": "Shop now",
    "hero_marquee_1": "Crafted with care",
    "hero_marquee_2": "Made to last",
    "hero_marquee_3": "Loved every day",
    "showcase_heading": "The signature edit",
    "showcase_link": "Shop all",
    "showcase_caption_1": "The signature",
    "showcase_caption_2": "In your hands",
    "showcase_caption_3": "Up close",
    "countdown_heading": "Limited time only",
    "countdown_subheading": "Order today and enjoy fast, tracked delivery",
    "countdown_cta": "Claim the offer",
    "look_1_eyebrow": "Everyday",
    "look_1_title": "Effortless",
    "look_1_caption": "Easy to use from morning to night",
    "look_2_eyebrow": "Signature",
    "look_2_title": "Made to shine",
    "look_2_caption": "The one everyone asks about",
    "look_3_eyebrow": "Gifting",
    "look_3_title": "With love",
    "look_3_caption": "Wrapped and ready to give",
    "ribbon_1": "Free shipping",
    "ribbon_2": "Easy returns",
    "ribbon_3": "Secure checkout",
    "ribbon_4": "Gift ready",
    "split_heading": "Made your way",
    "split_card_1_label": "View all products",
    "split_card_2_label": "Discover more",
    "editorial_1_heading": "Designed to last",
    "editorial_1_body": "Thoughtful materials and careful finishing make it something you reach for every day.",
    "editorial_1_cta": "Discover",
    "editorial_2_heading": "The perfect gift",
    "editorial_2_body": "Beautifully presented and ready to give, for the people who mean the most.",
    "editorial_2_cta": "Shop gifts",
    "banner_heading": "A little luxury, every day",
    "banner_cta": "Shop the look",
    "banner_marquee_1": "Made with love",
    "banner_marquee_2": "Ready to gift",
    "story_accent": "Our story",
    "story_heading": "Made for the moments that matter",
    "story_body": "Every detail is chosen with care, so it feels as good as it looks. It is the one you will keep coming back to.",
    "story_cta": "Shop now",
    "story_caption_title": "Loved daily",
    "story_caption_line": "Part of every day",
    "reviews_eyebrow": "Kind words",
    "reviews_heading": "Loved by customers",
    "tabs_heading": "Why it's special",
    "tab_1_title": "Quality",
    "tab_1_text": "Carefully made with materials chosen to look beautiful and last.",
    "tab_2_title": "Comfort",
    "tab_2_text": "Designed to feel easy, so you can enjoy it all day long.",
    "tab_3_title": "Care",
    "tab_3_text": "Simple to look after, so it stays as lovely as the day it arrived.",
    "promise_heading": "Our promise",
    "promise_1_label": "Quality",
    "promise_1_text": "Every order is checked by hand before it leaves us.",
    "promise_2_label": "Shipping",
    "promise_2_text": "Fast, tracked delivery straight to your door.",
    "promise_3_label": "Returns",
    "promise_3_text": "Changed your mind? Returns are simple and stress free.",
    "promise_4_label": "Support",
    "promise_4_text": "Real people, ready to help whenever you need us.",
    "promise_5_label": "Secure",
    "promise_5_text": "Checkout is encrypted and your details stay private.",
    "gallery_heading": "Seen on you",
    "gallery_1_label": "Everyday ease",
    "gallery_2_label": "Gift ready",
    "gallery_3_label": "Made to shine",
    "gallery_4_label": "Little details",
    "gallery_5_label": "Your new favourite",
    "gallery_6_label": "Shop the look",
    "customer_name_1": "Reviewer Name",
    "customer_review_1": "Enter customer review over here",
    "customer_name_2": "Reviewer Name",
    "customer_review_2": "Enter customer review over here",
    "customer_name_3": "Reviewer Name",
    "customer_review_3": "Enter customer review over here",
    "customer_name_4": "Reviewer Name",
    "customer_review_4": "Enter customer review over here"
};

const AMOUR_TEXT_OVERRIDES = {
    "health_beauty": {
        "demo_product_title": "Noir Rose Eau de Parfum",
        "hero_eyebrow": "Wear it like a secret",
        "hero_heading": "Noir rose, after dark",
        "hero_marquee_1": "Dark rose",
        "hero_marquee_2": "Warm oud",
        "hero_marquee_3": "Soft vanilla",
        "showcase_heading": "The scent edit",
        "look_1_eyebrow": "Evening",
        "look_1_title": "Velvet",
        "look_1_caption": "A trail that lingers all night",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Noir rose",
        "look_2_caption": "The scent everyone asks about",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Boxed and ready to give",
        "split_heading": "Find your signature",
        "editorial_1_heading": "Crafted to last",
        "editorial_1_body": "Rich notes of dark rose and oud unfold slowly, staying with you from first spray to late night.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "A heavy glass bottle and gold cap, wrapped and ready for someone you love.",
        "banner_heading": "Spotlight on Noir Rose",
        "story_accent": "Our story",
        "story_heading": "A fragrance made for the evening",
        "story_body": "We blended dark rose, warm oud and soft vanilla into a scent that feels like candlelight. One spray carries you through the night.",
        "story_caption_title": "After dark",
        "story_caption_line": "Your evening ritual",
        "tabs_heading": "Inside the bottle",
        "tab_1_title": "Top notes",
        "tab_1_text": "Bright pink pepper and a first breath of fresh rose petals.",
        "tab_2_title": "Heart",
        "tab_2_text": "Deep velvety rose wrapped around smoky, precious oud.",
        "tab_3_title": "Base",
        "tab_3_text": "Warm vanilla and amber that linger softly on the skin.",
        "gallery_heading": "Worn by you"
    },
    "fashion": {
        "demo_product_title": "Bordeaux Leather Crossbody Bag",
        "hero_eyebrow": "Carry it your way",
        "hero_heading": "The Bordeaux bag",
        "hero_marquee_1": "Smooth leather",
        "hero_marquee_2": "Gold hardware",
        "hero_marquee_3": "Day to night",
        "showcase_heading": "The leather edit",
        "look_1_eyebrow": "Day",
        "look_1_title": "Effortless",
        "look_1_caption": "Hands free from coffee to commute",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Bordeaux",
        "look_2_caption": "The bag everyone asks about",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Wrapped and ready to give",
        "split_heading": "Worn your way",
        "editorial_1_heading": "Made to last",
        "editorial_1_body": "Smooth burgundy leather and a gold turn-lock clasp, built to look better every year.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "A timeless piece they will carry for years, beautifully boxed and ready to give.",
        "banner_heading": "Spotlight on Bordeaux",
        "story_accent": "Our story",
        "story_heading": "Small bag, big presence",
        "story_body": "We designed a compact bag that holds your essentials and finishes every outfit. Switch the strap and take it from desk to dinner.",
        "story_caption_title": "Day to night",
        "story_caption_line": "Carried every day",
        "tabs_heading": "Why it's special",
        "tab_1_title": "Leather",
        "tab_1_text": "Smooth full-grain leather in a rich burgundy that softens with wear.",
        "tab_2_title": "Hardware",
        "tab_2_text": "A polished gold turn-lock clasp and chain that catch the light.",
        "tab_3_title": "Strap",
        "tab_3_text": "Adjustable chain-and-leather strap for crossbody or shoulder wear.",
        "gallery_heading": "Seen on you"
    },
    "general": {
        "demo_product_title": "Heritage Leather Strap Watch",
        "hero_eyebrow": "Time, well kept",
        "hero_heading": "The Heritage watch",
        "hero_marquee_1": "Gold-tone case",
        "hero_marquee_2": "Genuine leather",
        "hero_marquee_3": "Everyday luxury",
        "showcase_heading": "The timepiece edit",
        "look_1_eyebrow": "Everyday",
        "look_1_title": "Classic",
        "look_1_caption": "Easy to wear from morning to night",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Heritage",
        "look_2_caption": "The watch everyone notices",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Boxed and ready to give",
        "split_heading": "Find your best",
        "editorial_1_heading": "Built to last",
        "editorial_1_body": "A gold-tone case and genuine leather strap made to be worn every single day.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "A timeless watch for the moments that matter, wrapped and ready to give.",
        "banner_heading": "Spotlight on Heritage",
        "story_accent": "Our story",
        "story_heading": "A watch for every chapter",
        "story_body": "We kept the design simple so it goes with everything. A cream dial, slim gold hands and soft leather make it a quiet favourite.",
        "story_caption_title": "Every moment",
        "story_caption_line": "Worn every day",
        "tabs_heading": "Why it's special",
        "tab_1_title": "Case",
        "tab_1_text": "A slim 38mm gold-tone case that sits comfortably on any wrist.",
        "tab_2_title": "Dial",
        "tab_2_text": "A clean cream dial with slim gold hands that are easy to read.",
        "tab_3_title": "Strap",
        "tab_3_text": "Genuine dark brown leather that softens and shapes to you.",
        "gallery_heading": "Seen on you"
    },
    "home_kitchen": {
        "demo_product_title": "Amber Glow Soy Candle",
        "hero_eyebrow": "Light the evening",
        "hero_heading": "The Amber Glow candle",
        "hero_marquee_1": "Fig and cedar",
        "hero_marquee_2": "Hand-poured soy",
        "hero_marquee_3": "Fifty hour burn",
        "showcase_heading": "The candle edit",
        "look_1_eyebrow": "Evening",
        "look_1_title": "Cosy",
        "look_1_caption": "Warm light for slow nights in",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Amber glow",
        "look_2_caption": "The scent that fills the room",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Wrapped and ready to give",
        "split_heading": "Set the mood",
        "editorial_1_heading": "Hand poured",
        "editorial_1_body": "Natural soy wax and a wooden wick that crackles softly as it burns.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "A ribbed amber vessel with a brass lid, ready to wrap for someone special.",
        "banner_heading": "Spotlight on Amber Glow",
        "story_accent": "Our story",
        "story_heading": "Warmth you can light",
        "story_body": "We poured fig, cedar and amber into a candle that makes any room feel like home. Light it, settle in and let the evening slow down.",
        "story_caption_title": "Slow evenings",
        "story_caption_line": "Your nightly ritual",
        "tabs_heading": "Why it's special",
        "tab_1_title": "Scent",
        "tab_1_text": "Ripe fig, soft cedar and warm amber that fill the room gently.",
        "tab_2_title": "Wax",
        "tab_2_text": "Clean-burning natural soy wax poured by hand in small batches.",
        "tab_3_title": "Vessel",
        "tab_3_text": "Ribbed amber glass with a brass lid you will want to keep.",
        "gallery_heading": "Seen at home"
    },
    "kids_toys": {
        "demo_product_title": "Twirling Ballerina Music Box",
        "hero_eyebrow": "A little magic",
        "hero_heading": "The ballerina music box",
        "hero_marquee_1": "Wind-up melody",
        "hero_marquee_2": "Twirling dancer",
        "hero_marquee_3": "Keepsake gift",
        "showcase_heading": "The keepsake edit",
        "look_1_eyebrow": "Bedtime",
        "look_1_title": "Dreamy",
        "look_1_caption": "A gentle melody before sleep",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Twirl",
        "look_2_caption": "The gift they will treasure",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Wrapped and ready to give",
        "split_heading": "Made to treasure",
        "editorial_1_heading": "Built to keep",
        "editorial_1_body": "Solid wood, gold trim and a velvet tray made to hold little treasures for years.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "Birthdays, recitals or just because, a keepsake they will open again and again.",
        "banner_heading": "Spotlight on the music box",
        "story_accent": "Our story",
        "story_heading": "A keepsake full of wonder",
        "story_body": "Open the lid and a tiny ballerina twirls to a gentle melody. It turns tidying away treasures into a little moment of magic.",
        "story_caption_title": "Little dreams",
        "story_caption_line": "Loved for years",
        "tabs_heading": "Why it's special",
        "tab_1_title": "Melody",
        "tab_1_text": "A wind-up tune that plays softly while the ballerina twirls.",
        "tab_2_title": "Craft",
        "tab_2_text": "Solid wood painted soft rose with hand-finished gold trim.",
        "tab_3_title": "Storage",
        "tab_3_text": "A mirror and velvet-lined tray for rings, clips and keepsakes.",
        "gallery_heading": "Loved by little ones"
    },
    "car_accessories": {
        "demo_product_title": "Aura Car Vent Diffuser",
        "hero_eyebrow": "Every drive, refined",
        "hero_heading": "The Aura diffuser",
        "hero_marquee_1": "Brushed gold",
        "hero_marquee_2": "Refillable scent",
        "hero_marquee_3": "Fits most vents",
        "showcase_heading": "The drive edit",
        "look_1_eyebrow": "Commute",
        "look_1_title": "Calm",
        "look_1_caption": "A softer start to every drive",
        "look_2_eyebrow": "Signature",
        "look_2_title": "Aura",
        "look_2_caption": "The detail passengers notice",
        "look_3_eyebrow": "Gifting",
        "look_3_title": "With love",
        "look_3_caption": "Wrapped and ready to give",
        "split_heading": "Drive in style",
        "editorial_1_heading": "Made to last",
        "editorial_1_body": "A brushed gold metal clip and quilted face that look sharp in any interior.",
        "editorial_2_heading": "The perfect gift",
        "editorial_2_body": "A small luxury for every driver, boxed and ready to give.",
        "banner_heading": "Spotlight on Aura",
        "story_accent": "Our story",
        "story_heading": "Luxury for every journey",
        "story_body": "We made a diffuser that looks as good as it smells. Clip it on, refill it in seconds and enjoy a calm, subtle scent on every trip.",
        "story_caption_title": "On the road",
        "story_caption_line": "Part of every drive",
        "tabs_heading": "Why it's special",
        "tab_1_title": "Design",
        "tab_1_text": "Brushed gold metal with a quilted leather-look face.",
        "tab_2_title": "Scent",
        "tab_2_text": "A refillable core that releases a subtle, long-lasting fragrance.",
        "tab_3_title": "Fit",
        "tab_3_text": "A secure clip that fits most car air vents in seconds.",
        "gallery_heading": "On the road"
    }
};

/**
 * Amour demo images: category-aware Amour pipeline (beauty = dark wine; kids/fashion =
 * bright; home = warm wood). Regenerate via:
 *   backend/backend/scripts/generate_amour_demo_images.py
 */
const AMOUR_HOME_IMAGES_BY_CATEGORY = {
    "health_beauty": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
    "fashion": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
    "general": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
    "home_kitchen": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
    "kids_toys": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
    "car_accessories": {
        "banner_image": "",
        "banner_image_2": "",
        "product_image_1": "",
        "product_image_2": "",
        "product_image_3": "",
        "look_image_1": "",
        "look_image_2": "",
        "look_image_3": "",
        "split_image": "",
        "editorial_image_1": "",
        "editorial_image_2": "",
        "story_image": "",
        "product_base_image": "",
    },
};

function buildAmourSingleByCategory() {
    /** @type {Record<string, { images: Record<string, string>; text: Record<string, string> }>} */
    const out = {};
    for (const key of STORE_CATEGORY_KEYS) {
        out[key] = {
            images: { ...(AMOUR_HOME_IMAGES_BY_CATEGORY[key] || AMOUR_HOME_IMAGES_BY_CATEGORY.general) },
            text: {
                ...AMOUR_HOME_TEXT_BASE,
                ...(AMOUR_TEXT_OVERRIDES[key] || AMOUR_TEXT_OVERRIDES.general),
            },
        };
    }
    return out;
}

export const AMOUR_SINGLE_HOME_PAGE_BY_CATEGORY = buildAmourSingleByCategory();

/** @deprecated Prefer getHomeDataForPreview — kept for older imports */
export const single_home_page = SINGLE_HOME_PAGE_BY_CATEGORY.kids_toys;
/** @deprecated Prefer getHomeDataForPreview — kept for older imports */
export const multi_home_page = MULTI_HOME_PAGE_BY_CATEGORY.fashion;

/**
 * Home page data for liquid preview keyed by store type, category, and homepage pack.
 * @param {"single" | "multi" | null | undefined} storeType
 * @param {string | null | undefined} category — e.g. storeCategory from StoreFlowStructure
 * @param {"classic" | "cinematic" | "amour" | "classic-prepaid" | string | null | undefined} [storeTemplatePack]
 */
export function getHomeDataForPreview(storeType, category, storeTemplatePack = "classic") {
    const key = normalizeHomeDataCategory(category);
    const pack = String(storeTemplatePack || "classic").trim().toLowerCase();
    if (pack === "cinematic" && storeType !== "multi") {
        return (
            CINEMATIC_SINGLE_HOME_PAGE_BY_CATEGORY[key] ??
            CINEMATIC_SINGLE_HOME_PAGE_BY_CATEGORY.general
        );
    }
    if (pack === "amour" && storeType !== "multi") {
        return (
            AMOUR_SINGLE_HOME_PAGE_BY_CATEGORY[key] ??
            AMOUR_SINGLE_HOME_PAGE_BY_CATEGORY.general
        );
    }
    // Dedicated Classic prepaid theme demos (distinct products from COD classic / Velvet).
    if (pack === "classic-prepaid" && storeType !== "multi") {
        return (
            PREPAID_CLASSIC_HOME_PAGE_BY_CATEGORY[key] ??
            PREPAID_CLASSIC_HOME_PAGE_BY_CATEGORY.general
        );
    }
    if (storeType === "multi") {
        return MULTI_HOME_PAGE_BY_CATEGORY[key] ?? MULTI_HOME_PAGE_BY_CATEGORY.general;
    }
    return SINGLE_HOME_PAGE_BY_CATEGORY[key] ?? SINGLE_HOME_PAGE_BY_CATEGORY.general;
}

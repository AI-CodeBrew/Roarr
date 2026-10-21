/** Shopify Admin money is a decimal string ("29.99"). Liquid `| money` expects cents. */
function amountToCents(value) {
    if (value == null || value === "") return null;
    const n = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
}

/** Real variant prices from the selected Shopify product. Null when the product has no price yet. */
function shopifyVariantsForPreview(shopifyProduct) {
    if (!shopifyProduct) return null;
    const edges = shopifyProduct?.variants?.edges;
    const list = Array.isArray(edges) && edges.length
        ? edges.map((edge) => edge?.node).filter(Boolean)
        : Array.isArray(shopifyProduct?.variants)
            ? shopifyProduct.variants
            : [];
    const mapped = list.map((node, index) => {
        const price = amountToCents(node?.price);
        if (price == null) return null;
        const compare = amountToCents(node?.compareAtPrice ?? node?.compare_at_price);
        return {
            id: node?.id || `preview-variant-${index + 1}`,
            title: node?.title || "Default",
            price,
            ...(compare != null && compare > price ? { compare_at_price: compare } : {}),
            available: node?.availableForSale !== false,
        };
    }).filter(Boolean);
    if (mapped.length) return mapped;
    const rangePrice = amountToCents(
        shopifyProduct?.priceRangeV2?.minVariantPrice?.amount ?? shopifyProduct?.price,
    );
    if (rangePrice == null) return null;
    return [{ id: "preview-variant-1", title: "Default", price: rangePrice, available: true }];
}

const aiResponseMapping = (magic_response, shopifyProduct) => {
    const body_images = magic_response.images?.body_images || {};
    const product_images = magic_response.images?.product_images || {};
    const color_schemes = magic_response.selected_color || magic_response.color_schemes?.[0];
    const text_fields = magic_response.text || {};
    const media = Object.entries(product_images)
        .filter(([, url]) => url)
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .map(([, url]) => ({
            media_type: "image",
            preview_image: typeof url === "string" ? url : (url?.src || url)
        }));
    const realVariants = shopifyVariantsForPreview(shopifyProduct);
    const variants = realVariants || [
        { id: "preview-variant-1", title: "Default", price: 9900, compare_at_price: 14900 }
    ];
    const product = {
        title: text_fields.product_title || "Product",
        media,
        price: variants[0].price,
        ...(variants[0].compare_at_price != null
            ? { compare_at_price: variants[0].compare_at_price }
            : {}),
        variants,
        selected_or_first_available_variant: null,
        metafields: {
            kluck_ai: {
                color_schema: { value: color_schemes },
                ...body_images,
                ...product_images,
                ...text_fields
            }
        }
    };
    product.selected_or_first_available_variant = product.variants[0];
    return { product };
};

const DEFAULT_MAGIC_RESPONSE = {
    "color_schemes": [
        "#4A6D7C",
        "#7C6A4A",
        "#A0A0A0",
        "#6D7C4A"
    ],
    "images": {
        "body_images": {
            "after_use_image": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "before_use_image": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "feature_image": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "happy_customer_image_1": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "happy_customer_image_2": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "happy_customer_image_3": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "problem_solving_image": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_highlight_1": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_highlight_2": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_highlight_3": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_highlight_4": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_impact_image": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006"
        },
        "product_images": {
            "product_image_1": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_image_2": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_image_3": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_image_4": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006",
            "product_image_5": "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/kluck_ai_store_banner_image_dafbfdfc-234c-4bb0-93ac-97ab523bc3b7.png?v=1776410006"
        }
    },
    "selected_color": "#4A6D7C",
    "text": {
        "circular_feature_1_desc": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "circular_feature_1_name": "Feature Name 1",
        "circular_feature_2_desc": "Enter your descriptive text over here for this section.",
        "circular_feature_2_name": "Feature Name 2",
        "circular_feature_3_desc": "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "circular_feature_3_name": "Feature Name 3",
        "circular_feature_4_desc": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "circular_feature_4_name": "Feature Name 4",
        "circular_features_heading": "Enter Heading Here",
        "creative_sassy_product_heading": "Your Main Heading Here",
        "creative_sassy_product_subheading_1": "Subheading Text 1",
        "creative_sassy_product_subheading_1_description": "Enter your detailed description here to showcase this specific feature.",
        "creative_sassy_product_subheading_2": "Subheading Text 2",
        "creative_sassy_product_subheading_2_description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "creative_sassy_product_subheading_3": "Subheading Text 3",
        "creative_sassy_product_subheading_3_description": "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "creative_sassy_product_subheading_4": "Subheading Text 4",
        "creative_sassy_product_subheading_4_description": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "faq_answer_1": "Enter your answer here. Lorem ipsum dolor sit amet.",
        "faq_answer_2": "Consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
        "faq_answer_3": "Ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
        "faq_answer_4": "Quis nostrud exercitation ullamco laboris nisi ut aliquip.",
        "faq_answer_5": "Ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
        "after_use_benefit_1": "Generic Benefit 1",
        "after_use_benefit_2": "Generic Benefit 2",
        "after_use_benefit_3": "Generic Benefit 3",
        "before_after_heading": "Enter Your Heading Here",
        "before_use_issue_1": "Generic Issue 1",
        "before_use_issue_2": "Generic Issue 2",
        "before_use_issue_3": "Generic Issue 3",
        "faq_question_1": "Enter your first question here?",
        "faq_question_2": "Enter your second question here?",
        "faq_question_3": "Enter your third question here?",
        "faq_question_4": "Enter your fourth question here?",
        "faq_question_5": "Enter your fifth question here?",
        "four_blocks_block_1_desc": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "four_blocks_block_1_name": "Block Title 1",
        "four_blocks_block_2_desc": "Enter a brief description for this block here.",
        "four_blocks_block_2_name": "Block Title 2",
        "four_blocks_block_3_desc": "Sed do eiusmod tempor incididunt ut labore et dolore.",
        "four_blocks_block_3_name": "Block Title 3",
        "four_blocks_block_4_desc": "Ut enim ad minim veniam, quis nostrud exercitation.",
        "four_blocks_block_4_name": "Block Title 4",
        "four_blocks_heading": "Main Block Heading Here",
        "four_blocks_subheading": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
        "high_impacting_product_heading": "High Impact Heading Here",
        "high_impacting_product_subheading": "Enter your product subheading or short description here. Lorem ipsum dolor sit amet.",
        "marquee_text_1": "Marquee Text 1",
        "marquee_text_2": "Marquee Text 2",
        "marquee_text_3": "Marquee Text 3",
        "product_question_1": "Enter your product question here?",
        "product_question_1_answer": "Product answer goes here. Lorem ipsum dolor sit amet.",
        "product_question_2": "Enter your product question here?",
        "product_question_2_answer": "Product answer goes here. Consectetur adipiscing elit.",
        "product_question_3": "Enter your product question here?",
        "product_question_3_answer": "Product answer goes here. Sed do eiusmod tempor incididunt.",
        "product_question_4": "Enter your product question here?",
        "product_question_4_answer": "Product answer goes here. Ut labore et dolore magna aliqua.",
        "product_subtitle": "Enter your product subtitle or short description here.",
        "product_title": "Your Product Title Here",
        "stats_section_heading": "Stats Section Heading Here",
        "stats_section_point_1_desc": "Enter a short description for this point.",
        "stats_section_point_1_heading": "Point Heading 1",
        "stats_section_point_2_desc": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "stats_section_point_2_heading": "Point Heading 2",
        "stats_section_point_3_desc": "Sed do eiusmod tempor incididunt ut labore et dolore.",
        "stats_section_point_3_heading": "Point Heading 3",
        "what_set_us_apart_subheading": "Enter Your Subheading Here",
        "what_sets_us_apart_feature_1": "Feature Text 1",
        "what_sets_us_apart_feature_2": "Feature Text 2",
        "what_sets_us_apart_feature_3": "Feature Text 3"
    }
}
export { aiResponseMapping, DEFAULT_MAGIC_RESPONSE };
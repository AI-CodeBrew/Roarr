/**
 * Collection page preview — `collection/collection-2` block mapping from store homeData.
 * Uses the same keys as {@link collectionShowcaseApplyHomeData} in `../home/multi-product-sections.js`:
 * - title → `text.top_product_punchline_${n}`
 * - image → `images.product_impact_image_${n}`
 * where `n` is the 1-based index among `collection_item` blocks.
 */

/**
 * @param {Record<string, unknown>} homeData
 * @param {Record<string, unknown>} sectionSettingsOnly
 * @param {Array<{ id?: string, type: string, settings: Record<string, unknown> }>} blocksData
 * @returns {{ sectionSettingsOnly: Record<string, unknown>, blocksData: typeof blocksData }}
 */
export function collectionGridCollectionPageApplyHomeData(homeData, sectionSettingsOnly, blocksData) {
    const text = homeData?.text ?? {};
    const images = homeData?.images ?? {};
    const blocks = (blocksData || []).map((block, i) => {
        if (block.type !== "collection_item") return block;
        const n = i + 1;
        const title = text[`top_product_punchline_${n}`];
        const image = images[`product_impact_image_${n}`];
        return {
            ...block,
            settings: {
                ...block.settings,
                ...(title && { title }),
                ...(image && { image })
            }
        };
    });
    return {
        sectionSettingsOnly: { ...sectionSettingsOnly, homeData },
        blocksData: blocks
    };
}

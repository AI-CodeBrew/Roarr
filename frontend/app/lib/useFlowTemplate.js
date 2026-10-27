import { useEffect, useState } from "react";

/** Featured template of each build flow, read from the flow's own template data. */
const LOADERS = {
  product: () =>
    import("../routes/_app.generate_pdp/product-page/productTemplateOptions.js").then(
      ({ getProductTemplateCardMedia, PRODUCT_TEMPLATE_OPTIONS }) => {
        const option = PRODUCT_TEMPLATE_OPTIONS.find((o) => o.id === 4) || PRODUCT_TEMPLATE_OPTIONS[0];
        return option ? { name: option.title, ...getProductTemplateCardMedia(option) } : null;
      },
    ),
  store: () =>
    import("../routes/_app.generate_store/store/storeThemeCombos.js").then(
      ({ getStoreComboCardMedia, MULTI_THEME_COMBOS, PREPAID_CLASSIC_THEME_COMBO }) => {
        const combo =
          MULTI_THEME_COMBOS.find((c) => c.pack === "lumenook") || PREPAID_CLASSIC_THEME_COMBO;
        return { name: combo.title, ...getStoreComboCardMedia(combo) };
      },
    ),
};

/**
 * `{ name, thumbUrl, hoverImageUrl }` for the product or store flow's featured template,
 * loaded on demand (the demo data is large); null until it arrives.
 * @param {"product" | "store"} kind
 */
export function useFlowTemplate(kind) {
  const [template, setTemplate] = useState(null);
  useEffect(() => {
    let active = true;
    LOADERS[kind]?.()
      .then((next) => {
        if (active) setTemplate(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [kind]);
  return template;
}

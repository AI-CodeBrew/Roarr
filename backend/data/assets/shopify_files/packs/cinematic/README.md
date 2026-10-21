# Pack: cinematic

COD + single-product store homepage pack inspired by `Kluck React /kluck-react` **layouts**
(sections, tickers, hero, mobile/desktop splits).

**Colors are not fixed** — they follow the merchant’s selected accent / scheme-1 / scheme-2
(same as classic), via `--color-accent`, `--color-accent-soft`, and `--color-on-accent`.

**Product page:** simple `product.json` only (no premium Sleek/Vibe PDP).
**Cost:** 300 credits (COD single cinematic) vs 500 for classic COD (with premium PDP).

- Does **not** replace classic (`store_templates/single_product`).
- FAQ / Contact / About / 404 / Collection JSON shared with classic single_product.
- Publish sections live in `liquid_files/kluck-ai-cinematic-*.liquid` (unique names).
- Generate schemas live in `generate/store/templates/packs/cinematic/`.
- Preview lives in `kluck-embeded/app/liquid/packs/cinematic/` + schema pack folder.

Selection key: `storeTemplatePack: "cinematic"` (default `"classic"`).

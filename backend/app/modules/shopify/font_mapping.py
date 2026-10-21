"""
Font mapping from human-friendly frontend names to Shopify font identifiers.

Expected usage: when the frontend sends a font *label* (e.g. "Barlow Condensed"),
map it to the Shopify font value (e.g. "barlow_condensed_n4") before patching
`config/settings_data.json`.
"""

SHOPIFY_FONTS = {
    # Google Fonts (available in Shopify's font library)
    "Josefin Sans": "josefin_sans_n4",  # normal 400
    "Almarai": "almarai_n4",  # normal 400 — verify in picker
    "Bodoni Moda": "bodoni_moda_n4",  # normal 400
    "Tenor Sans": "tenor_sans_n4",  # normal 400
    "Assistant": "assistant_n4",  # normal 400
    "Abel": "abel_n4",  # normal 400
    "Inter": "inter_n4",  # normal 400
    "Work Sans": "work_sans_n4",  # normal 400
    "Roboto": "roboto_n4",  # normal 400
    "Oswald": "oswald_n4",  # normal 400
    "Poppins": "poppins_n4",  # normal 400
    "Montserrat": "montserrat_n4",  # normal 400
    "Playfair Display": "playfair_display_n4",  # normal 400
    "Lora": "lora_n4",  # normal 400
    "Open Sans": "open_sans_n4",  # normal 400
    "Nunito": "nunito_n4",  # normal 400
    "Source Sans 3": "source_sans_3_n4",  # normal 400
    "Rajdhani": "rajdhani_n4",  # normal 400
    "Barlow": "barlow_n4",  # normal 400
    "Barlow Condensed": "barlow_condensed_n4",  # normal 400
    "Dosis": "dosis_n4",  # normal 400
    "DM Sans": "dm_sans_n4",  # normal 400
    "Merriweather": "merriweather_n4",  # normal 400
    "Muli": "muli_n4",  # deprecated - fallback may be required client-side
    "Comfortaa": "comfortaa_n4",  # normal 400
    "Prompt": "prompt_n4",  # normal 400
    "Nunito Sans": "nunito_sans_n4",
    "Cormorant Garamond": "cormorant_n4",
    "Archivo":"archivo_n4",
    "Manrope":"manrope_n4",
    # System fonts (no Google Fonts URL needed)
    "Helvetica": "helvetica_n4",  # system sans-serif
    "Arial": "arial_n4",  # system sans-serif
    "Georgia": "georgia_n4",  # system serif
}


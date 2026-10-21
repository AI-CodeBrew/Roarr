"""
Home prompt builder — single source of truth for home-page image prompt logic.

Imported by:
  - generate_images.py  (store generation pipeline)
  - prompt-playground/server.py  (/api/build-prompt)

To iterate on prompts: edit this file in the playground context, then PR it to push
changes to production. No other files need changing for pure prompt improvements.

Subcategory data (IMAGE_SUBCATEGORIES, CATEGORY_DETECTION_SYSTEM_PROMPT,
HEALTH_BEAUTY_SUBCATEGORIES, detect_image_subcategory) lives in detect_subcategory.py.
"""
import json
from typing import Any, Dict, List, Optional

from .detect_subcategory import IMAGE_SUBCATEGORIES  # noqa: F401 — re-exported for callers that imported it from here

# ---------------------------------------------------------------------------
# Aspect ratios per image type
# ---------------------------------------------------------------------------
_RATIO_BY_TYPE: Dict[str, str] = {
    "banner_image":   "16:9",
    "banner_image_1": "16:9",
    "banner_image_2": "16:9",
    "banner_image_3": "16:9",
    "creative_image": "1:1",
    "highlight_image": "3:4",
}

# ---------------------------------------------------------------------------
# Camera specs
# ---------------------------------------------------------------------------
CAMERA_SPEC = "iPhone 16"

# Medium-format specs for highlight and banner images — pulls from high-end
# photographic training data and avoids the HDR/computational-photography look
# that "iPhone" triggers in generative models.
HIGHLIGHT_CAMERA_SPEC = (
    "Phase One XT — 32mm f/8, ISO 100, even panoramic studio exposure, "
    "edge-to-edge tack-sharp throughout, no vignette, 3:4"
)
# No aspect ratio here: banners are 16:9, and a "3:4" spec made the model shoot a
# portrait photo and pad the rest of the wide frame with flat colour bands.
BANNER_CAMERA_SPEC = (
    "Phase One XT — 32mm f/8, ISO 100, even studio exposure, "
    "edge-to-edge tack-sharp throughout, no vignette, single full-bleed wide frame"
)

# One continuous photo. Asking for an "empty" left side made the model paint flat
# panels or a second wall there, so the banner looked like cut images side by side.
BANNER_SINGLE_FRAME = (
    "The whole frame is ONE continuous photograph taken in one shot: the same room, surface, "
    "light and perspective run unbroken from the left edge to the right edge. No split screen, "
    "no diptych or collage, no colour-block panels, no vertical bands, borders, seams or frames, "
    "no image placed inside another image."
)

# ---------------------------------------------------------------------------
# Per-subcategory environment style hints injected into every prompt
# ---------------------------------------------------------------------------
SUBCATEGORY_ENV_HINTS: Dict[str, str] = {
    "skincare": (
        "Skincare products generally showcase well in clean, pure, and calm settings. "
        "Environments that tend to work: marble or glass surfaces with soft natural light, "
        "spa-like stone or ceramic compositions, arrangements that include botanicals or key "
        "ingredients. The emotional goal is purity, ritual, and trust in the product."
    ),
    "hair_care": (
        "Hair care resonates in personal grooming contexts. Good directions include vanity or "
        "bathroom shelf setups with warm morning light, counter compositions with simple grooming "
        "props, or minimal lifestyle shots that feel like a real morning routine."
    ),
    "makeup_cosmetics": (
        "Makeup products perform well in bold, editorial environments. Approaches that work: "
        "high-gloss surfaces like dark marble or mirror tiles, saturated colour-block backgrounds "
        "that complement the product palette, or dramatic beauty-campaign lighting. The mood should "
        "feel confident, glamorous, and intentional."
    ),
    "body_care": (
        "Body care works well in sensorial, indulgent settings. Good directions: spa-inspired stone "
        "or ceramic surfaces, warm earthy colour palettes, or fresh water/steam elements that evoke "
        "cleansing and self-care. The product should feel like a treat."
    ),
    "fragrance_perfume": (
        "Fragrance products excel in atmospheric, emotional environments. Rich, moody approaches "
        "tend to work: dark velvet or jewel-toned surfaces, single dramatic spotlight compositions, "
        "or abstract material arrangements. The goal is to evoke emotion and sensory experience — "
        "not just display the bottle."
    ),
    "oral_care": (
        "Oral care works best in clean, fresh, clinical-premium settings. Good directions include "
        "white or cool marble surfaces with crisp diffused light, mint or water elements suggesting "
        "freshness, or minimal bathroom-counter compositions. Cleanliness is the key message."
    ),
    "grooming": (
        "Grooming products connect in confident, masculine editorial environments. Dark slate, aged "
        "leather, or brushed metal surfaces with strong directional lighting tend to work well. The "
        "mood should feel precise, intentional, and premium. For creative images, a grooming moment "
        "in use — a shave, a trim, a ritual — can make the product feel real and aspirational rather "
        "than just displayed."
    ),
    "wellness_supplements": (
        "Wellness products resonate in natural, health-conscious environments. Good directions: "
        "organic wood or stone with warm light, botanical or ingredient-focused prop styling, or "
        "clean lifestyle compositions that communicate daily ritual and natural origin."
    ),
    "nail_care": (
        "Nail care benefits from colour-forward, fashion-editorial styling. Surfaces and backgrounds "
        "that complement the product's colour story tend to perform well, with bright even lighting "
        "that makes colours pop. Lean into the product's palette."
    ),
    "beauty_tools_accessories": (
        "Beauty tools work on precision editorial surfaces — glass, chrome, or clean stone. Sharp "
        "studio lighting that reveals build quality, or fashion-forward compositions that position the "
        "tool as a luxury accessory rather than just a utility item. For creative images, showing the "
        "tool in a grooming or beauty application moment — in hand, in use — can be far more evocative "
        "than a still life."
    ),
    "electronics_tech": (
        "Tech products perform well in dark, engineered, precision environments. Dark matte surfaces "
        "(gunmetal, slate, charcoal) with cool cinematic lighting, or clean minimalist desk setups "
        "that balance lifestyle and performance. The goal: communicate engineering quality and premium "
        "build."
    ),
    "phone_accessories": (
        "Phone accessories work in clean, modern, device-integrated contexts. Minimalist desk or "
        "display surfaces with soft ambient light, or flat-lay setups that show the accessory alongside "
        "a device. Keep the emphasis on design, fit, and compatibility."
    ),
    "gaming": (
        "Gaming gear resonates in dramatic, high-energy, immersive environments. Dark setups with "
        "accent lighting, deep shadow compositions with focused product spotlighting, or cinematic dark "
        "environments that evoke the intensity and excitement of gaming. For creative images, showing "
        "the gear in an active gaming setup — a player mid-session, screen glow, full immersion — can "
        "be far more powerful than a static studio shot."
    ),
    "smart_home_iot": (
        "Smart home devices must feel embedded in real domestic life, not isolated on a product shelf. "
        "Specific environments that tend to work: (1) Kitchen counter with morning light — device "
        "mounted or placed in use context, coffee machine on, window light streaming across the scene. "
        "(2) Contemporary living room — soft evening lamp illuminating the device, TV on in the "
        "background, imperfect cosy domestic ambiance. (3) Hallway or entryway — directional downlight, "
        "coat hooks, shoes on the floor, device integrated into the doorway scene. (4) Bedroom at night "
        "— warm orange bedside lamp, device on a nightstand in a real bedroom context. (5) Home office "
        "— directional desk lamp, monitor glow, the device integrated in a working-from-home setup. "
        "(6) Modern apartment — poured concrete floors, Scandinavian furniture, the device blending "
        "into a design-forward interior. (7) Dark atmospheric set — the device's own screen glow and "
        "LEDs illuminating the scene, minimal other light, dramatic and tech-forward. The environment "
        "should always feel like a real home someone actually lives in."
    ),
    "kitchen": (
        "Kitchen products live in genuinely inhabited kitchens — not sterile white studios. Specific "
        "environments that tend to work: (1) Morning prep counter — harsh east-facing window cutting "
        "across a worn butcher-block surface, a half-drunk coffee mug nearby, crumbs and texture on "
        "the board. (2) Farmhouse kitchen — white shiplap walls, open shelving with mismatched "
        "ceramics, warm overhead pendants casting yellow pools. (3) Evening cooking — tungsten "
        "under-cabinet strip lights painting the counter amber while a window shows blue dusk outside, "
        "cast-iron pan on the hob. (4) Modern dark kitchen — black matte cabinetry, single brass tap, "
        "narrow directional spotlight from a track, deep shadows. (5) Mediterranean-style counter — "
        "terracotta tiles, rough plaster wall, olives and lemons as props, southern light bleaching "
        "one side. (6) Sunday brunch setup — full counter, newspaper, steaming kettle, food "
        "mid-preparation, uneven natural light from a side window. The goal is appetite, warmth, and "
        "the credibility of a real kitchen. For creative and highlight images, showing the product "
        "mid-use in a cooking scene — hands, ingredients, action — makes it feel essential."
    ),
    "home_appliances": (
        "Home appliances must feel like they belong in a real home — not staged in a showroom. "
        "Specific environments that tend to work: (1) Morning kitchen counter — slanting east window "
        "light, coffee maker already running, cluttered but warm surfaces, a real lived-in counter. "
        "(2) Evening living room — warm tungsten table lamp glow against wood flooring, dark corners, "
        "the product catching warm amber light while the room recedes. (3) Japandi-style interior — "
        "aged linen runner on a pale oak sideboard, raked late-afternoon sidelight, imperfect plaster "
        "wall, deliberately spare but never sterile. (4) Industrial kitchen loft — overhead exposed "
        "track lighting, cool cast, open metal shelving, worn concrete counter, urban feel. (5) Cosy "
        "weekend scene — steaming mug nearby, a book left open, Sunday morning window light coming in "
        "low, no harsh shadows. (6) Modern bathroom counter — cool morning light from a frosted window, "
        "stone surface, steam in the air, towel folded imperfectly. (7) Garden room or conservatory — "
        "dappled plant-filtered light, natural textures, warm afternoon sun. The environment must have "
        "evidence of daily life — imperfect, warm, credibly domestic. Never a plain white counter "
        "under symmetrical diffused light."
    ),
    "furniture_decor": (
        "Furniture and decor must be shown in genuinely inhabited rooms, not empty showroom vignettes. "
        "Specific environments that tend to work: (1) Living room with character — layered rugs, stacked "
        "books, afternoon sun raking across the piece from a tall window, shadows falling naturally. "
        "(2) Bedroom corner — warm bedside lamp creating a pool of amber light, unmade linen nearby, "
        "morning light from curtains. (3) Dining room at golden hour — long table with half-cleared "
        "dishes, candles, low directional late sun through a window. (4) Modern apartment — poured "
        "concrete floor, narrow window casting a hard diagonal light, minimal but imperfect surfaces, "
        "urban view. (5) Heritage home — original cornicing, deep skirting, warm evening lamp on worn "
        "parquet. (6) Garden or terrace — outdoor light, dappled shadows, stone or decking, natural "
        "materials. The goal is helping customers picture the piece in their own real space — it needs "
        "to feel lived in and plausible."
    ),
    "cleaning_household": (
        "Cleaning products benefit from bright, hygienic, fresh environments. Clean light domestic "
        "surfaces with crisp overhead lighting, compositions that suggest order and cleanliness. "
        "Efficacy and freshness are the emotions to communicate."
    ),
    "fashion_apparel": (
        "Fashion and apparel perform in aspirational, editorial environments. Clean studio backdrops "
        "with strong directional lighting, styled wardrobe or flat-lay compositions, or bold campaign "
        "settings that express the brand's identity and the wearer's lifestyle. For creative and "
        "highlight images, showing the garment actually worn in an editorial or lifestyle context — "
        "a model, a movement, a moment — can be particularly effective."
    ),
    "jewelry_watches": (
        "Jewelry and watches are best showcased on rich, premium surfaces. Dark velvet, polished "
        "marble, or reflective materials with precision lighting that catches sparkle and reflections. "
        "Luxury editorial arrangements that communicate desirability and craftsmanship."
    ),
    "sports_outdoors": (
        "Outdoor and sports products connect in natural, active, rugged environments. Trail textures, "
        "rock or water-edge settings, or action-inspired studio compositions with dramatic directional "
        "lighting. Communicate durability, performance, and the spirit of the activity. For creative "
        "and highlight images, showing the product in active use in a real outdoor setting — a climber "
        "on rock, a runner on trail — can be highly compelling."
    ),
    "fitness": (
        "Fitness products perform in energetic, athletic environments. Gym or exercise surface "
        "compositions with strong dramatic lighting, or high-contrast studio shots that convey strength "
        "and motion. Avoid overly soft or domestic aesthetics. For creative and highlight images, "
        "showing the product in active use during exercise — with a person, motion, or physical effort "
        "— can powerfully communicate its purpose."
    ),
    "toys_games": (
        "Toys and games work in bright, playful, high-energy environments. Vibrant colour blocks, "
        "cheerful even lighting, or imaginative compositions. Be bold with colour — the goal is to "
        "communicate fun, excitement, and play."
    ),
    "baby": (
        "Baby products resonate in soft, nurturing, safe environments. Pastel surfaces, gentle warm "
        "diffused lighting, and cozy textures. Compositions should feel calm, gentle, and trustworthy "
        "— nothing harsh or dramatic. For creative images, showing the product in a nurturing moment "
        "— a baby interacting with it, a caregiver using it — communicates safety and trust far better "
        "than a product-alone shot."
    ),
    "arts_craft": (
        "Craft products feel at home in warm, creative, handmade-feeling environments. Wood surfaces, "
        "craft paper, or textured studio setups with warm lighting and a handmade aesthetic. A slight "
        "sense of creative process or imperfection can enhance authenticity. For creative images, "
        "showing the product mid-process — hands at work, a project in progress, tools in use — can "
        "be the most authentic and compelling direction."
    ),
    "books_stationery": (
        "Books and stationery work in intellectual, focused lifestyle settings. Clean desk or table "
        "compositions with warm reading light, thoughtful flat-lay arrangements, or contexts that "
        "evoke creativity, writing, or quiet focus."
    ),
    "pet_supplies": (
        "Pet products connect in warm, domestic, caring environments. Soft home interior surfaces "
        "with warm natural light, outdoor nature settings, or lifestyle shots that center the "
        "relationship between pet and owner. For creative and highlight images, showing the product "
        "with a pet actively interacting with it — a dog with a toy, a cat with a bed — adds genuine "
        "warmth and connection."
    ),
    "travel_luggage": (
        "Travel products perform in aspirational, journey-inspired settings. Architectural floors, "
        "hotel or airport textures, or destination-context compositions. The goal is wanderlust — "
        "communicate that this product belongs on an adventure."
    ),
    "food_diet": (
        "Food and diet products work in styled food photography environments. Marble, dark wood, or "
        "slate with professional overhead or angled lighting, complementary ingredient or flavour "
        "props. The goal is appetite appeal and authenticity — the product should feel real and "
        "desirable."
    ),
    "spiritual_religious": (
        "Spiritual and devotional items resonate in peaceful, contemplative settings. Natural wood "
        "or stone with soft warm ambient light, candles or incense as contextual elements, minimal "
        "serene compositions. Avoid clinical or commercial aesthetics."
    ),
    "automotive_tools": (
        "Automotive tools are best presented in factual, workshop environments. Concrete or steel "
        "surfaces with strong overhead utility lighting. Credibility and precision matter more than "
        "beauty — let the engineering speak. For creative images, showing the tool in active use on "
        "a vehicle — hands gripping, a task in progress — builds immediate credibility and purpose."
    ),
    "car_accessories": (
        "Car accessories work in vehicle-integrated or clean garage contexts. On-seat, on-dashboard, "
        "or interior context shots, or clean precision studio compositions that show fit and function. "
        "For creative images, showing the accessory installed and in use inside a vehicle — a real "
        "in-car moment — communicates fit and value more directly than any studio shot."
    ),
    "industrial_machinery": (
        "Industrial machinery should be presented with clarity and technical accuracy. Clean industrial "
        "surfaces with strong factual overhead lighting. Scale, precision, and build quality are the "
        "key messages."
    ),
    "general": (
        "Without a specific product category, lean toward versatile studio or lifestyle environments "
        "that feel premium and well-lit. Adapt based on the product's purpose, personality, and what "
        "would make a customer immediately understand how it fits into their life."
    ),
}

# ---------------------------------------------------------------------------
# Simplified environment style hints for highlight images only.
# These deliberately omit numbered environment lists and named aesthetic
# keywords (e.g. "Japandi", "cosy weekend scene", "industrial loft") that
# cause generative models to over-index on Pinterest-board tropes.
# Each entry states the core creative principle + one anti-direction.
# ---------------------------------------------------------------------------
HIGHLIGHT_ENV_HINTS: Dict[str, str] = {
    "skincare": (
        "Skincare must feel like a real personal ritual — not a staged spa display. "
        "The space should be intimate and inhabited, with evidence of daily use. "
        "Never a pristine white surface under symmetrical studio light."
    ),
    "hair_care": (
        "Hair care lives in a real bathroom or personal space — warm, used, imperfect. "
        "The environment should feel like someone's genuine morning routine, not a "
        "magazine shoot set."
    ),
    "makeup_cosmetics": (
        "Makeup works in bold, personal, inhabited environments. The setting should "
        "feel intentional and real — not a generic neutral backdrop."
    ),
    "body_care": (
        "Body care belongs in warm, sensorial, personal environments. The space should "
        "feel genuinely used — not staged or sterile."
    ),
    "fragrance_perfume": (
        "Fragrance must live in atmospheric, emotional spaces — rich, moody, personal. "
        "The environment should evoke feeling, not just display the product."
    ),
    "oral_care": (
        "Oral care works in clean, fresh, genuinely inhabited personal spaces — a real "
        "bathroom counter, not a clinical product display."
    ),
    "grooming": (
        "Grooming gear belongs in a real, lived-in personal space. The environment "
        "should feel precise and credible — not a generic studio setup."
    ),
    "wellness_supplements": (
        "Wellness products live in warm, natural, health-conscious environments. The "
        "space should feel genuinely inhabited and domestic — not a sterile supplement "
        "display."
    ),
    "nail_care": (
        "Nail care works in personal, colour-forward inhabited environments. The setting "
        "should feel real and genuine, not a generic flat-lay."
    ),
    "beauty_tools_accessories": (
        "Beauty tools belong in real personal grooming spaces — not isolated on a "
        "display surface. The environment should feel inhabited and credible."
    ),
    "electronics_tech": (
        "Tech products must feel integrated into a real workspace or living environment "
        "— not isolated on a display shelf. The setting should be inhabited and "
        "credible."
    ),
    "phone_accessories": (
        "Phone accessories belong in real everyday environments — a desk, a pocket, a "
        "hand. The setting should feel genuine and lived-in, not a product display."
    ),
    "gaming": (
        "Gaming gear must feel embedded in a real, active gaming environment — not a "
        "showroom. The setting should have energy and immersion — someone actually in "
        "the middle of a session."
    ),
    "smart_home_iot": (
        "Smart home devices must feel embedded in real domestic life — not isolated on "
        "a product shelf. The environment must have evidence of daily life, imperfect "
        "and warm. Never a plain surface under symmetrical diffused light."
    ),
    "kitchen": (
        "Kitchen products live in genuinely inhabited kitchens — not sterile white "
        "studios. The environment must feel warm and credibly domestic — the kind of "
        "kitchen someone actually cooks in."
    ),
    "home_appliances": (
        "Home appliances must feel like they belong in a real home — not staged in a "
        "showroom. The environment must have evidence of daily life — imperfect, warm, "
        "credibly domestic. Never a plain white counter under symmetrical diffused light."
    ),
    "furniture_decor": (
        "Furniture and decor must be shown in genuinely inhabited rooms — not empty "
        "showroom vignettes. The space should feel lived in and plausible, not staged "
        "for a catalogue."
    ),
    "cleaning_household": (
        "Cleaning products belong in real domestic spaces that feel bright and "
        "lived-in. The environment should communicate order and freshness without "
        "feeling sterile or clinical."
    ),
    "fashion_apparel": (
        "Fashion and apparel must be shown in real, inhabited lifestyle environments. "
        "The setting should feel aspirational but genuine — not a studio backdrop."
    ),
    "jewelry_watches": (
        "Jewelry and watches belong in warm, personal, real-life moments — not "
        "isolated on a display surface. The setting should feel genuinely inhabited "
        "and emotional."
    ),
    "sports_outdoors": (
        "Outdoor and sports products must feel embedded in real, active environments "
        "— a trail, a climb, a genuine outdoor moment. Not a studio or showroom."
    ),
    "fitness": (
        "Fitness products must feel embedded in real, active physical effort — not a "
        "clean studio. The environment should communicate genuine exertion and motion."
    ),
    "toys_games": (
        "Toys and games belong in bright, playful, genuinely inhabited spaces. The "
        "environment should feel energetic and real — not a sterile product display."
    ),
    "baby": (
        "Baby products must feel safe, warm, and genuinely domestic. The environment "
        "should feel like a real home — soft, nurturing, and credible. Never clinical "
        "or staged."
    ),
    "arts_craft": (
        "Craft products belong in warm, creative, genuinely inhabited spaces — with "
        "evidence of real creative process. Not a pristine studio setup."
    ),
    "books_stationery": (
        "Books and stationery live in real, thoughtful personal spaces — a desk, a "
        "reading corner. The environment should feel inhabited and focused, not a "
        "generic flat-lay."
    ),
    "pet_supplies": (
        "Pet products belong in warm, domestic, genuinely inhabited environments — "
        "with a real pet present and engaged. Not a staged still-life."
    ),
    "travel_luggage": (
        "Travel products must feel embedded in real journey contexts — an actual place, "
        "a real trip in progress. Not a studio backdrop."
    ),
    "food_diet": (
        "Food and diet products live in real, appetising environments — a genuine "
        "kitchen or dining context, not a sterile product display."
    ),
    "spiritual_religious": (
        "Spiritual items must feel peaceful and genuinely personal — placed in a real "
        "contemplative setting, not a commercial product display."
    ),
    "automotive_tools": (
        "Automotive tools belong in real workshop or vehicle environments — credible, "
        "functional, and genuinely in use. Not a clean studio display."
    ),
    "car_accessories": (
        "Car accessories must feel embedded in a real vehicle or garage context — "
        "installed and in use, not isolated on a display surface."
    ),
    "industrial_machinery": (
        "Industrial machinery must feel embedded in a real operational environment — "
        "credible scale, context, and use. Not a showroom display."
    ),
    "general": (
        "Without a specific category, the environment should feel real, inhabited, and "
        "adapted to the product's natural use context. Authentic imperfection over "
        "staged perfection."
    ),
}

# ---------------------------------------------------------------------------
# Per-subcategory usage hint for highlight images
# Only defined for categories where the "in use" moment is universal.
# Intentionally omitted for broad categories (kitchen, electronics, etc.)
# where the model infers correct use from product name + description.
# ---------------------------------------------------------------------------
HIGHLIGHT_USAGE_BY_SUBCAT: Dict[str, str] = {
    # Personal care / beauty
    "skincare":          "someone actively applying the product to their face — fingertips pressing it into skin",
    "hair_care":         "someone washing or conditioning their hair — product being worked through wet hair, hands in motion",
    "makeup_cosmetics":  "being applied — a brush or finger mid-stroke on skin, product actively in use",
    "body_care":         "someone massaging the product into their body — hands working it into skin",
    "fragrance_perfume": "someone spritzing the fragrance onto their wrist or neck — mist caught in the air",
    "grooming":          "mid-grooming routine — razor to face, comb through hair, or product being worked into beard",
    "nail_care":         "being applied to nails — brush mid-stroke, a manicure in progress",
    # Home categories — concrete domestic-moment anchors to prevent the model
    # from inventing generic "fun summer" or "children playing" scenes
    "home_appliances":   "in operation in a home — running, in use, integrated into a domestic moment",
    "kitchen":           "in active use in a kitchen — a meal in progress, hands involved, the product doing its job",
    "smart_home_iot":    "integrated into a real domestic moment — active and in use, part of daily home life",
    "furniture_decor":   "present in a genuinely inhabited room — in use, lived with, part of a real domestic scene",
    "cleaning_household": "actively in use — a cleaning task in progress, integrated into a real domestic moment",
    # Activity / lifestyle
    "fitness":           "mid-workout — in hand or in use during exercise, sweat, effort, real physical motion",
    "fashion_apparel":   "worn on a person in motion — the garment as worn in a real lifestyle moment, not flat or posed",
    "jewelry_watches":   "worn on the body — wrist, neck, or ear — caught in natural light during a real moment",
    "gaming":            "in an active gaming session — controller gripped, screen glowing, a player fully immersed",
    "pet_supplies":      "a pet actively using or playing with it — a genuine animal moment, not a posed still-life",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_home_image_prompt(
    image_type: str,
    subcategory: str,
    product_slots: List[Dict[str, Any]],
) -> str:
    """
    Build a structured JSON prompt string for home-page image generation.

    Args:
        image_type:    One of banner_image, banner_image_1/2/3, creative_image,
                       highlight_image.
        subcategory:   Detected product subcategory key (e.g. "skincare").
        product_slots: List of product dicts with at minimum "title" and
                       "description" keys. Single-item list for most types;
                       multi-item for highlight_image on a multi-product store.
                       Each slot may optionally carry "subcategory" and
                       "category_label" for per-product overrides.

    Returns:
        JSON-formatted prompt string matching the playground output.
    """
    is_banner   = image_type.startswith("banner")
    is_creative = image_type == "creative_image"
    is_highlight = image_type == "highlight_image"

    ratio = _RATIO_BY_TYPE.get(image_type, "16:9")
    cat_key = subcategory or "general"
    category_label = cat_key.replace("_", " ").title()

    slots = product_slots or []
    num_products = len(slots) if slots else 1
    is_multi = num_products > 1

    # --- fidelity_constraint ---
    if is_creative:
        fidelity_constraint = (
            "The product's physical form must be faithful — geometry, materials, proportions, and "
            "branding exactly as in the reference. It does not need to dominate the frame. It can be "
            "set within a scene, partially framed, or composed alongside environmental elements, as "
            "long as it remains clearly legible and physically accurate."
        )
    elif is_highlight:
        if is_multi:
            fidelity_constraint = (
                "Product 2's identity must be clearly recognisable — its form, materials, proportions, "
                "and branding faithful to the reference. It may be partially held, worn, in motion, or "
                "shown in the act of being used; full surface visibility is not required as long as it is "
                "unambiguously identifiable. Do not isolate it on a plain surface."
            )
        else:
            fidelity_constraint = (
                "The product's identity must be clearly recognisable — its form, materials, proportions, "
                "and branding faithful to the reference. It may be partially held, worn, in motion, or "
                "shown in the act of being used; full surface visibility is not required as long as it is "
                "unambiguously identifiable. Do not isolate it on a plain surface."
            )
    else:
        if is_multi:
            fidelity_constraint = (
                "All products are the clear central focus, with perfectly preserved geometry, materials, "
                "proportions, and branding exactly as shown in the provided reference images."
            )
        else:
            fidelity_constraint = (
                "The product is the clear central focus, with perfectly preserved geometry, materials, "
                "proportions, and branding exactly as shown in the provided reference image — this "
                "explicitly includes logo scale: brand marks must appear at exactly the same size "
                "relative to the product as in the reference, no larger."
            )

    # --- generation_task ---
    if is_creative:
        generation_task = f"Create a {ratio} creative lifestyle image for a high-end ecommerce brand."
    elif is_highlight:
        if is_multi:
            generation_task = (
                f"Create a {ratio} highlight image featuring product 2 in use for the brand home page."
            )
        else:
            generation_task = (
                f"Create a {ratio} highlight image featuring the product for the brand home page."
            )
    else:
        generation_task = f"Create a {ratio} banner image for a high-end ecommerce store."

    # P2 subcategory — used for multi-product highlight usage scene
    p2_subcat = slots[1].get("subcategory", cat_key) if len(slots) > 1 else cat_key

    # --- image_direction ---
    if is_creative:
        image_direction = (
            "The product exists inside a world, not in front of a backdrop. Build a real or "
            "dramatized environment where the product belongs — foreground elements, depth, "
            "atmospheric haze, selective focus, cinematic framing. The product should feel "
            "discovered rather than posed. Magazine campaign quality."
        )
    elif is_highlight:
        if is_multi:
            p2_usage_hint = HIGHLIGHT_USAGE_BY_SUBCAT.get(p2_subcat)
            if p2_usage_hint:
                p2_usage_line = f"A {ratio} cinematic scene: {p2_usage_hint}."
            else:
                p2_usage_line = (
                    f"A {ratio} cinematic scene: product 2 in active, natural use — the product's "
                    "own purpose and the provided name and description determine what that use moment "
                    "looks like."
                )
            image_direction = (
                f"{p2_usage_line} A person present and actively engaged — this is not a still-life. "
                "The human and the environment are messy and colorful. The human has skin blemishes "
                "and unevenness. Human is wearing non plain, non seasonal clothes and has accessories. "
                "The product is seen at human scale within a real environment, not isolated on a surface. "
                "The world around it matters as much as the product itself. "
                "If books are used they should have proper covers and real like pages."
            )
        else:
            usage_hint = HIGHLIGHT_USAGE_BY_SUBCAT.get(cat_key)
            if usage_hint:
                usage_line = f"A {ratio} cinematic scene: {usage_hint}."
            else:
                usage_line = (
                    f"A {ratio} cinematic scene: the product in active, natural use — the product's "
                    "own purpose and the provided name and description determine what that use moment "
                    "looks like."
                )
            image_direction = (
                f"{usage_line} A person present and actively engaged — this is not a still-life. "
                "The human and the environment are messy and colorful. The human has skin blemishes "
                "and unevenness. Human is wearing non plain, non seasonal clothes and has accessories. "
                "The product is seen at human scale within a real environment, not isolated on a surface. "
                "The world around it matters as much as the product itself. "
                "If books are used they should have proper covers and real like pages."
            )
    else:
        _home_subcat_set = {
            "home_appliances", "kitchen", "smart_home_iot",
            "furniture_decor", "cleaning_household",
        }
        if cat_key in _home_subcat_set:
            image_direction = (
                "The product is shown in a real, inhabited home environment — not a studio. "
                "It is positioned in the right 60% of the frame. The left 40% is the same room "
                "continuing out of focus — soft, uncluttered wall or background of that scene with "
                "no objects in front of it and no text, words, letters, or typography (text will be "
                "composited in post-production, never inside the image). The room has character: "
                "textured walls, objects on surfaces, evidence of daily life. Natural asymmetric "
                "window light or domestic lamp light (not symmetric studio diffusion). The product "
                "is the hero but the home is genuine — show the space, not just a blank counter. "
                "The background graduates from a darker, richer tone on the left edge to a lighter "
                "tone toward the right — a smooth, natural colour gradient, not a hard shadow or black "
                "zone. The dark left edge must be a deep shade of the dominant background colour "
                "(never pure black), so white text placed there reads clearly. "
                + BANNER_SINGLE_FRAME
            )
        else:
            image_direction = (
                "Clean, confident commercial product photography. The product is positioned in the "
                "right 60% of the frame. The left 40% is the same background continuing out of "
                "focus — soft and uncluttered, with no objects and no text, words, letters, or "
                "typography (text will be composited in post-production, never inside the image). "
                "Background supports without competing. Precise, "
                "flattering lighting. Gallery-quality commercial result. "
                "The background graduates from a darker, richer tone on the left edge to a lighter "
                "tone toward the right — a smooth, natural colour gradient, not a hard shadow or black "
                "zone. The dark left edge must be a deep shade of the dominant background colour "
                "(never pure black), so white text placed there reads clearly. "
                + BANNER_SINGLE_FRAME
            )

    # --- environment_style ---
    # Highlight images use stripped-down hints that avoid named aesthetic
    # keywords (Japandi, cosy weekend, etc.) that trigger Pinterest tropes.
    # For multi-product highlight, environment is keyed to P2's subcategory.
    if is_highlight:
        env_key = p2_subcat if is_multi else cat_key
        environment_style = HIGHLIGHT_ENV_HINTS.get(env_key, HIGHLIGHT_ENV_HINTS["general"])
    else:
        environment_style = SUBCATEGORY_ENV_HINTS.get(
            cat_key,
            "neutral studio surface, professional diffused lighting, clean minimal background",
        )

    # --- environment_design ---
    if is_creative:
        environment_design = (
            "Build a world this product lives in. The environment is the story — the product is part "
            "of it, not placed in front of it. Commit to one specific, immersive scene with real depth, "
            "texture, and atmosphere. Use environment_style as a creative nudge, not a rigid script."
        )
    elif is_highlight:
        if is_multi:
            environment_design = (
                "Design one specific environment that feels real and inhabited — product 2's natural "
                "use context. One lighting scheme, one colour palette, one spatial logic throughout. "
                "Use environment_style as a creative starting point."
            )
        else:
            environment_design = (
                "Design one specific environment that feels real and inhabited — the product's natural "
                "use context. One lighting scheme, one colour palette, one spatial logic throughout. "
                "Use environment_style as a creative starting point."
            )
    else:
        environment_design = (
            "Design a specific, original environment that showcases this product's purpose and "
            "materials. Use environment_style as a creative starting point, not a rigid script. Make "
            "a specific choice that best showcases this particular product's purpose, materials, and "
            "emotional vibe."
        )

    # --- product_context ---
    if is_highlight and is_multi:
        # Multi-product highlight shows P2 in a usage scene — only include P2 so the
        # model isn't confused by descriptions of the other products in the store.
        p2 = slots[1]
        product_context: Any = {
            "subcategory": p2.get("subcategory", cat_key),
            "category": p2.get("category_label", category_label),
            "name": p2.get("title", ""),
            "description": p2.get("description", ""),
        }
    elif len(slots) <= 1:
        p = slots[0] if slots else {}
        product_context = {
            "subcategory": cat_key,
            "category": category_label,
            "name": p.get("title", ""),
            "description": p.get("description", ""),
        }
    else:
        product_context = [
            {
                "slot": f"P{i + 1}",
                "subcategory": slot.get("subcategory", cat_key),
                "category": slot.get("category_label", category_label),
                "name": slot.get("title", ""),
                "description": slot.get("description", ""),
            }
            for i, slot in enumerate(slots)
        ]

    if is_highlight:
        # Prescribing specific artifacts ("film grain", "lens aberration") causes
        # the model to apply a heavy artificial filter. A concept-level instruction
        # yields more natural results.
        photorealism_and_anti_ai = (
            "To ensure absolute photorealism, render authentic unretouched photographic imperfections."
        )
        if is_multi:
            negative_constraints = (
                "CRITICAL: absolutely no rendered text, words, letters, numbers, typography, labels, "
                "captions, or copy of any kind anywhere in the image — the image must be entirely "
                "text-free. No third-party logos, no distortion, no invented product components, "
                "and no alteration of existing brand marks or packaging — logos and brand marks must "
                "appear at exactly the same scale and visual prominence relative to the product as shown "
                "in the reference, never enlarged or hero-ized beyond the reference. "
                "No props, no windows, no outside lighting, no unrealistic effects."
            )
        else:
            # Banning windows prevents the model from mixing natural and indoor light,
            # which consistently produces conflicting shadows and uncanny atmosphere.
            negative_constraints = (
                "CRITICAL: absolutely no rendered text, words, letters, numbers, typography, labels, "
                "captions, or copy of any kind anywhere in the image — the image must be entirely "
                "text-free. No third-party logos, no distortion, no invented product components, "
                "and no alteration of existing brand marks or packaging — logos and brand marks must "
                "appear at exactly the same scale and visual prominence relative to the product as shown "
                "in the reference, never enlarged or hero-ized beyond the reference. "
                "No props, no windows, no outside lighting, no unrealistic effects."
            )
    else:
        photorealism_and_anti_ai = (
            "Render authentic unretouched photographic imperfections: genuine surface texture, "
            "natural film grain in shadows, slight lens aberration. Materials and light must behave "
            "exactly as they would in a real photograph."
        )
        negative_constraints = (
            "CRITICAL: absolutely no rendered text, words, letters, numbers, typography, labels, "
            "captions, or copy of any kind anywhere in the image — the image must be entirely "
            "text-free. No third-party logos, no distortion, no invented product components, "
            "no alteration of existing brand marks or packaging — logos and brand marks must appear "
            "at exactly the same scale and visual prominence relative to the product as shown in the "
            "reference, never enlarged or hero-ized beyond the reference. "
            "No props, no anthropomorphism, no unnatural placements."
        )

    payload = {
        "fidelity_constraint": fidelity_constraint,
        "product_context": product_context,
        "generation_task": generation_task,
        "image_direction": image_direction,
        "camera": HIGHLIGHT_CAMERA_SPEC if is_highlight else BANNER_CAMERA_SPEC if is_banner else CAMERA_SPEC,
        "environment_style": environment_style,
        "environment_design": environment_design,
        "photorealism_and_anti_ai": photorealism_and_anti_ai,
        "lighting": "scene appropriate and overindexed on realism",
        "negative_constraints": negative_constraints,
    }

    return json.dumps(payload, indent=2)

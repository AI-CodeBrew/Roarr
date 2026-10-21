"""
Subcategory detection — single source of truth for product subcategories.

Imported by:
  - generate_images.py  (detect_image_subcategory, HEALTH_BEAUTY_SUBCATEGORIES)
  - home_prompt_builder.py  (IMAGE_SUBCATEGORIES for prompt payload enum)
  - prompt-playground/server.py  (/api/detect-category)

To add a new subcategory: add it to IMAGE_SUBCATEGORIES, add its definition to
CATEGORY_DETECTION_SYSTEM_PROMPT, and add it to HEALTH_BEAUTY_SUBCATEGORIES if applicable.
No other files need changing.
"""
import json

IMAGE_SUBCATEGORIES = [
    "electronics_tech",
    "phone_accessories",
    "gaming",
    "kitchen",
    "home_appliances",
    "fashion_apparel",
    "jewelry_watches",
    "sports_outdoors",
    "fitness",
    "toys_games",
    "baby",
    "arts_craft",
    "automotive_tools",
    "car_accessories",
    "furniture_decor",
    "books_stationery",
    "pet_supplies",
    "travel_luggage",
    "industrial_machinery",
    "skincare",
    "hair_care",
    "makeup_cosmetics",
    "body_care",
    "fragrance_perfume",
    "oral_care",
    "grooming",
    "wellness_supplements",
    "nail_care",
    "beauty_tools_accessories",
    "cleaning_household",
    "spiritual_religious",
    "smart_home_iot",
    "food_diet",
]

CATEGORY_DETECTION_SYSTEM_PROMPT = """You are an expert at categorizing products.
Read the product title and description very carefully word by word before making a decision. Pay close attention to what the product actually is, what it does, and how it is used — do not assume based on a single keyword.

Analyze the product and determine which subcategory best fits it for generating appropriate product and body images.

Available subcategories with definitions:

- electronics_tech: Consumer electronics such as laptops, tablets, monitors, TVs, speakers, headphones, cameras, smart home devices, chargers, cables, adapters, power banks, and general tech gadgets.
- phone_accessories: Phone cases, screen protectors, phone mounts, phone stands, wireless chargers, earbuds, phone grips, styluses, and any accessory designed specifically for smartphones.
- gaming: Video game consoles, controllers, gaming keyboards, gaming mice, gaming headsets, gaming chairs, VR headsets, and gaming-specific peripherals or accessories.
- kitchen: Cookware, bakeware, utensils, cutting boards, knives, food storage containers, dinnerware, drinkware, kitchen organizers, and manual kitchen tools (non-electric).
- home_appliances: Electric or powered household appliances such as blenders, mixers, coffee makers, toasters, air fryers, vacuum cleaners, air purifiers, humidifiers, fans, heaters, irons, and washing machines.
- fashion_apparel: Clothing, shoes, sneakers, boots, hats, scarves, belts, handbags, wallets, sunglasses, and wearable fashion accessories (excluding jewelry and watches).
- jewelry_watches: Rings, necklaces, bracelets, earrings, watches (smart and traditional), cufflinks, brooches, anklets, and fine or fashion jewelry.
- sports_outdoors: Camping gear, hiking gear, bicycles, sports balls, protective gear, outdoor recreation products, fishing equipment, climbing gear, kayaks, tents, and team sport accessories. Does NOT include gym/fitness equipment — use fitness for those.
- fitness: Gym and workout equipment such as dumbbells, kettlebells, resistance bands, yoga mats, pull-up bars, jump ropes, foam rollers, exercise bikes, treadmills, weight benches, ab rollers, fitness trackers, gym gloves, and home workout accessories.
- toys_games: Children's toys, board games, card games, puzzles, action figures, dolls, building blocks, RC vehicles, educational toys, and play sets.
- baby: Baby bottles, pacifiers, strollers, car seats, cribs, baby monitors, diapers, baby clothing, teething toys, and infant care products.
- arts_craft: Paints, brushes, canvases, sewing supplies, knitting yarn, craft kits, scrapbooking materials, clay, beads, and DIY art supplies.
- automotive_tools: Mechanic tools, wrenches, jacks, tire inflators, jump starters, OBD scanners, car wash equipment, detailing supplies, and garage workshop tools.
- car_accessories: Car seat covers, floor mats, steering wheel covers, car phone mounts, dash cams, car organizers, air fresheners, sun shades, and interior/exterior car accessories (non-tool).
- furniture_decor: Furniture items like tables, chairs, shelves, desks, sofas, and home decor such as vases, candles, picture frames, wall art, rugs, throw pillows, and decorative lighting. Furniture assistive tools as well
- books_stationery: Books, notebooks, journals, planners, pens, pencils, markers, desk organizers, sticky notes, envelopes, and office/school stationery supplies.
- pet_supplies: Pet food, pet bowls, leashes, collars, pet beds, pet toys, grooming tools for pets, aquariums, cages, and animal care products.
- travel_luggage: Suitcases, carry-on bags, backpacks, duffel bags, packing cubes, travel pillows, passport holders, luggage tags, and travel organizer accessories.
- industrial_machinery: Heavy-duty tools, power tools (drills, saws, grinders), welding equipment, industrial pumps, generators, compressors, and professional-grade workshop or factory machinery.
- skincare: Facial cleansers, moisturizers, serums, sunscreens, face masks, toners, eye creams, exfoliators, acne treatments, and anti-aging products for the skin.
- hair_care: Shampoos, conditioners, hair oils, hair masks, leave-in treatments, hair serums, dry shampoo, scalp treatments, and hair growth products.
- makeup_cosmetics: Foundations, concealers, lipsticks, eyeshadows, mascaras, blushes, bronzers, primers, setting sprays, and cosmetic palettes.
- body_care: Body lotions, body washes, shower gels, body scrubs, hand creams, foot creams, deodorants, body butters, and general body moisturizing or cleansing products.
- fragrance_perfume: Perfumes, colognes, eau de toilette, body mists, fragrance gift sets, solid perfumes, and scent-focused personal products.
- oral_care: Toothbrushes (manual and electric), toothpaste, mouthwash, dental floss, teeth whitening kits, tongue scrapers, and dental hygiene products.
- grooming: Razors, trimmers, beard oils, beard balms, shaving creams, aftershave, grooming kits, and men's or women's personal grooming tools.
- wellness_supplements: Vitamins, dietary supplements, protein powders, probiotics, herbal supplements, collagen powders, omega oils, and health/nutrition capsules or tablets.
- nail_care: Nail polishes, nail files, cuticle oils, nail clippers, gel polish kits, nail art supplies, nail strengtheners, and manicure/pedicure tools.
- beauty_tools_accessories: Makeup brushes, beauty sponges, eyelash curlers, hair dryers, flat irons, curling irons, facial rollers, derma rollers, LED face masks, and beauty applicator tools.
- cleaning_household: Cleaning sprays, mops, brooms, sponges, dish soap, laundry detergent, trash bags, storage bins, lint rollers, dusters, disinfectant wipes, and general household cleaning supplies and organizers.
- spiritual_religious: Prayer beads, incense, meditation cushions, religious figurines, candles for worship, prayer mats, spiritual books, rosaries, crystals, singing bowls, and faith-based or devotional items.
- smart_home_iot: Smart plugs, smart bulbs, smart locks, Wi-Fi cameras, smart thermostats, smart doorbells, home automation hubs, IoT sensors, smart displays, and connected home devices controlled via app or voice assistant.
- food_diet: Packaged foods, snacks, meal kits, diet plans, protein bars, meal replacement shakes, superfoods, dried fruits, nuts, organic foods, specialty teas, coffee beans, spices, sauces, condiments, and consumable food or diet-related products.

Re-read the product title and description one more time before answering. Choose the single most appropriate subcategory based on the product's primary function and use case, not just a keyword match.
You must choose a subcategory from the list above. Do not make up a subcategory.
"""

# Subcategories that use the health/beauty body-image generation pipeline.
# Defined here alongside IMAGE_SUBCATEGORIES so both lists stay in sync.
HEALTH_BEAUTY_SUBCATEGORIES = [
    "skincare",
    "hair_care",
    "makeup_cosmetics",
    "body_care",
    "fragrance_perfume",
    "oral_care",
    "grooming",
    "wellness_supplements",
    "nail_care",
    "beauty_tools_accessories",
]


def detect_image_subcategory(product_title: str, product_description: str) -> str:
    """
    Detect the image subcategory for a product using LLM.
    The LLM will choose from all available subcategories.

    Args:
        product_title: The title/name of the product
        product_description: Detailed description of the product

    Returns:
        str: The detected subcategory name (e.g., "electronics_tech", "skincare")
    """
    # Lazy import — keeps this module side-effect-free at import time.
    # Works from both the Flask backend and the prompt-playground server
    # as long as backend/ is in sys.path.
    from app.clients.openai_client import client as openai_client

    try:
        print(f"🔍 Detecting image subcategory for product: {product_title}")

        user_content = f"Product Title: {product_title}"
        if product_description:
            user_content += f"\nProduct Description: {product_description}"

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CATEGORY_DETECTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "image_subcategory_schema",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "subcategory": {
                                "type": "string",
                                "enum": IMAGE_SUBCATEGORIES,
                            }
                        },
                        "required": ["subcategory"],
                        "additionalProperties": False,
                    },
                },
            },
        )

        choice = response.choices[0].message

        if hasattr(choice, "parsed") and choice.parsed is not None:
            structured_output = choice.parsed
        else:
            structured_output = json.loads(choice.content)

        detected_subcategory = structured_output["subcategory"]
        print(f"✓ Detected image subcategory: {detected_subcategory}")

        return detected_subcategory

    except Exception as e:
        print(f"⚠ Error detecting image subcategory: {e}")
        print(f"⚠ Falling back to default subcategory")
        return "electronics_tech"  # Default fallback

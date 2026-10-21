"""Cinematic pack image prompt overrides.

banner_image → CINEMATIC_HERO_BANNER_PROMPT (16:9 desktop)
banner_image_mobile → CINEMATIC_HERO_MOBILE_PROMPT (9:16 mobile, same creative)
product_story_image → CINEMATIC_PRODUCT_STORY_PROMPT
why_shop_image → CINEMATIC_WHY_SHOP_PROMPT
circle_feature_image appends CIRCLE_FEATURE_PROMPT_SUFFIX on the classic feature prompt.
"""

CINEMATIC_HERO_BANNER_PROMPT = """
Create a SUPER-PREMIUM CINEMATIC ECOMMERCE HERO BANNER using the uploaded product image as the EXACT visual reference.

==================================================
FINAL OUTPUT
==================================================

- 3840 × 2160 px
- 16:9 horizontal hero-banner composition
- Ultra-sharp, Retina-ready
- Photorealistic commercial advertising quality
- Bold, classy, high-fashion campaign aesthetic (luxury global brand — NOT a flat simple product shot)
- High-impact, conversion-focused, expensive-looking
- ONE finished hero banner only

==================================================
1. FIRST: ANALYZE THE PRODUCT
==================================================

Before designing the banner, visually analyze the uploaded image and determine:

- What the product actually is
- Its most accurate SHORT generic product name
- Its category
- Its EXACT materials and TRUE product colors (hue, saturation, finish)
- The most appropriate premium visual environment for that category

Do NOT invent specifications, benefits, awards, claims, features or certifications.

==================================================
2. PRODUCT IS THE ABSOLUTE HERO — CENTERED
==================================================

The uploaded product is the PRIMARY and DOMINANT visual element.

The viewer's eye must immediately go to the PRODUCT before noticing anything else.

Give the product approximately 55–70% of the visual attention.

Make the product:

- Large
- Crisp
- Highly visible
- Professionally lit
- Premium and dimensional
- Realistic
- Clearly separated from the background
- BOLD presence — iconic campaign hero scale

COMPOSITION (mandatory for web and mobile):
- Place the product PROPERLY CENTERED in the frame (horizontal and vertical center bias).
- Keep a balanced safe margin around the product so it is not cropped.
- Slight 3D tilt / premium angle is allowed, but the product must still read as centered.
- Do NOT shove the product aside to make room for type — product stays centered; type lives in soft negative space.

==================================================
3. STRICT PRODUCT PRESERVATION — ESPECIALLY COLORS
==================================================

Preserve the uploaded product as faithfully as possible.

KEEP EXACTLY:

- Exact overall shape
- Correct proportions
- Construction
- Materials and surface finish (matte / gloss / metal / fabric as in the upload)
- TRUE PRODUCT COLORS — same hues, same saturation, same lightness as the uploaded photo
- Important physical details
- Buttons, ports, cables, handles, openings, attachments, accessories
- Packaging structure where applicable
- Legitimate branding printed on the real product

HARD COLOR RULE:
- Do NOT recolor, tint, grade, or “beautify” the product into a different colorway.
- Do NOT shift product whites to blue/cream, blacks to purple, metals to a different alloy look, or plastics to a new hue.
- Environment lighting may add soft reflections — but the product’s base colors must still match the upload.
- If cinematic grading is used, grade the BACKGROUND only; keep the product color-true.

DO NOT:

- Redesign the product
- Modernize it
- Change its shape
- Add features
- Remove functional components
- Change the number of components
- Replace it with a similar product
- Distort proportions
- Invent accessories
- Change the product’s color palette

The generated product must remain clearly recognizable as the uploaded reference — including color.

==================================================
4. ONE CLASSY TEXT ACCENT — SAME CONTENT, BETTER CRAFT
==================================================

Add ONE light touch of typography — the same amount of text as before, but make it look CLASSY and expensive.

CONTENT (do not add more text):
- ONE short line only: the product’s accurate SHORT generic name (2–4 words max)
  OR one very short atmospheric word (e.g. “Crafted”, “Pure”, “Elevate”)
- Prefer the real short product name when it is clear from the upload.
- NO second line, NO subtitle, NO slogans, NO CTAs, NO prices, NO awards, NO specs,
  NO fake logos, NO watermarks, NO UI chrome.
- Do NOT add any extra words beyond that single short line.

TYPECRAFT (make it classy — not plain “simple text”):
- Luxury editorial / haute fashion campaign lettering
- Refined letter-spacing (elegant tracking), balanced weight, premium proportions
- Clean high-end sans or refined serif — never chunky, never comic, never default “basic” type
- Optional: very subtle small-caps or all-caps with refined tracking for a couture feel
- Feels engraved into the atmosphere — intentional, expensive, quiet confidence
- NOT: plain centered WordArt, sticker text, thin weak type, or clumsy AI lettering

PLACEMENT (critical — do not cover the product):
- Product stays CENTERED and fully readable; text must NEVER overlap the product silhouette.
- Place type in quiet negative space — typically the upper third, or a soft band above/below the product,
  with generous breathing room from the product edges.
- Keep safe margins from all four frame edges.
- Type integrated into the cinematic atmosphere — not pasted on.
- Scale: refined small-to-medium — roughly 5–12% of frame height. Never billboard-huge.

COLOR & LEGIBILITY:
- Muted, refined, premium — soft ivory / champagne on dark scenes, or soft charcoal on light scenes.
- Slight softness is good; never neon, never harsh pure black on dark, never high-chroma.
- Readable via quiet space / soft vignette behind letters — NO solid boxes, pills, banners, or stickers.
- At most a barely-there soft luminescence — no cheap outlines or heavy drop shadows.

HIERARCHY:
1. PRODUCT (color-true, centered, bold)
2. Bold classy cinematic background
3. Single classy text accent

==================================================
5. BACKGROUND — BOLDER, CLASSY, MORE PROFESSIONAL
==================================================

Do NOT make a simple, flat, or sparse hero.
Push for a BOLD, CLASSY, PROFESSIONAL campaign key visual — richer depth, stronger lighting drama,
more expensive materials — WITHOUT adding more text or clutter.

Give the background REAL cinematic weight (about 35–50% of the visual story) while the product stays dominant:

- Deep cinematic lighting gradients and high-contrast key/fill
- Directional light, soft volumetric rays, controlled haze
- Rich material texture (stone, brushed metal, glass, lacquer, fabric, mist — category-true)
- Strong depth of field / bokeh behind the product
- Elegant reflections, speculars, and gradient glows
- Clear foreground / midground / background separation
- Luxury-brand campaign energy — bold but refined, never busy

The background must feel expensive and intentional — NOT a plain empty studio void.

However:

BACKGROUND MUST SUPPORT THE PRODUCT, NEVER COMPETE WITH IT OR HIDE IT.
Do NOT recolor the product to match the scene — adapt the scene to the product’s true colors.

Avoid excessive scenery, clutter, and unnecessary props.

==================================================
6. CATEGORY-ADAPTIVE ENVIRONMENT
==================================================

DO NOT reuse the same scene for every product.

Maintain the SAME LEVEL OF:

- Bold cinematic impact
- Composition quality
- Premium lighting
- Hero-product scale
- Depth
- Realism
- Advertising quality

BUT adapt the environment to the actual category.

TECH / ELECTRONICS:
Dark metallic or futuristic studio, controlled light beams, graphite surfaces, subtle energy or technical textures.

AUDIO:
Dark premium acoustic environment, subtle waveform/light forms, glossy or metallic surfaces.

BEAUTY / SKINCARE:
Elegant soft studio, water, serum, cream, glass, stone or subtle botanical elements.

KITCHEN:
Premium kitchen-inspired material palette, natural stone, wood, brushed metal or subtle relevant ingredients.

HOME / LIVING:
Sophisticated modern interior-inspired environment, architectural surfaces and natural light.

FASHION:
Luxury editorial studio, fabric or architectural forms.

JEWELRY:
Dark luxury surfaces, glass, satin, stone or metallic reflections.

TOYS:
Bright dimensional environment with restrained playful elements.

PET:
Warm natural lifestyle textures with minimal pet-related cues.

HEALTH / WELLNESS:
Clean modern wellness environment with subtle clinical or spa cues.

FITNESS:
Dynamic performance lighting and restrained motion cues.

AUTOMOTIVE:
Dark engineered environment, metal, carbon texture and dramatic directional lighting.

OUTDOOR:
Natural cinematic landscape cues and rugged materials.

FOOD / BEVERAGE:
Relevant ingredients, glass, condensation, stone, wood, ice, steam or agricultural cues where appropriate.

OTHER:
Infer the most appropriate premium environment from the product's real purpose.

==================================================
7. MINIMAL CATEGORY CUES
==================================================

Use only approximately 1–3 subtle environmental cues.

The environment should SUPPORT the product, not turn into a full lifestyle scene.

Do NOT fill the entire scene with props.

==================================================
8. LIGHTING
==================================================

Use sophisticated commercial product lighting — bold and classy, not flat.

Include:

- Strong hero-product key light
- Controlled rim lighting
- Soft fill that preserves TRUE product colors
- Realistic highlights
- Contact shadows
- Reflections where appropriate
- Environmental light matching the scene
- Strong foreground/background separation
- Higher cinematic contrast than a basic catalog shot

The product should look physically present in the environment.

Use lighting to guide the viewer:

BRIGHTEST / MOST IMPORTANT:
PRODUCT (centered, color-true)

SECONDARY:
BOLD CINEMATIC BACKGROUND / ATMOSPHERE

TERTIARY:
CLASSY SINGLE-LINE TEXT (readable but never louder than the product)

==================================================
9. COLOR
==================================================

PRODUCT COLORS = LOCKED TO THE UPLOAD (non-negotiable).

Background palette may complement the product, but must never force a product recolor.
Text color must harmonize with the scene and stay softer than the product’s contrast.

==================================================
10. COMPOSITION
==================================================

Create a strong commercial hero composition:

- Large centered hero product with bold presence
- Clear visual hierarchy: product → rich atmosphere → one classy text line
- Controlled negative space for the text accent (never overlapping the product)
- Foreground / midground / background depth
- Premium, bold, classy, conversion-focused look — not simple or sparse

Do NOT make everything equally prominent.
Do NOT place unnecessary objects near the product.
Do NOT leave large meaningless empty areas — fill them with refined cinematic atmosphere (not more text).

==================================================
11. CAMERA / RENDER QUALITY
==================================================

Create the visual as if photographed for a major international luxury advertising campaign.

Use:

- High-end commercial product photography
- Full-frame / medium-format camera aesthetic
- Realistic perspective
- High dynamic range
- Ultra-detailed materials
- Realistic reflections
- Controlled depth of field
- Premium retouching
- Crisp product edges
- Subtle atmospheric depth
- Photorealistic rendering

Avoid an obvious AI-generated appearance.
Avoid a flat “simple product on plain backdrop” look.

==================================================
12. NEGATIVE CONSTRAINTS
==================================================

NO extra text beyond the single short classy line.
NO heavy / loud typography, multi-line copy, slogans, CTAs, prices, awards, or fake logos.
NO text overlapping the product.
NO solid text boxes, pills, banners, or stickers behind the type.
NO neon / high-chroma text colors.
NO product recolor / wrong product colorway.
NO watermarks.
NO clutter or busy lifestyle chaos.
NO flat empty / too-simple backdrop.
NO product redesign or fake features.
NO cropping important parts of the product.
NO off-center product pushed aside just to make space for type.

==================================================
13. VISUAL PRIORITY
==================================================

Follow this hierarchy exactly:

1. CENTERED COLOR-TRUE PRODUCT (visibility + exact colors)
2. BOLD CLASSY CINEMATIC BACKGROUND / LIGHTING
3. ONE CLASSY TEXT ACCENT (crafted lettering — not plain)
4. MINIMAL CATEGORY-RELEVANT ATMOSPHERE

==================================================
14. FINAL QUALITY CHECK
==================================================

Before finalizing, verify ALL of the following:

1. Do the product’s COLORS match the uploaded reference (not a different colorway)?
2. Does the product closely match the uploaded shape and details?
3. Is the product immediately the hero, large, and properly CENTERED?
4. Does the scene feel bold, classy, and professional — not simple or flat?
5. Is there ONLY one short text line — classy lettering, no extra words?
6. Does the text avoid overlapping the product, with safe margins?
7. Is text contrast softer than the product — readable but not dominant?
8. Does the background have rich cinematic presence without clutter?
9. Does the image work as a 16:9 eCommerce homepage hero?
10. Does it look like luxury commercial product photography?
11. Would the composition remain clear when displayed smaller on a website?

If product colors drifted, RESTORE them to the upload.
If the scene feels too simple, enrich lighting, depth, and materials — do NOT add more text.
If text looks plain, refine tracking/weight/elegance — do NOT add more words.

Generate ONE finished 3840 × 2160 premium cinematic eCommerce hero banner.
""".strip()

CINEMATIC_HERO_MOBILE_PROMPT = (
    CINEMATIC_HERO_BANNER_PROMPT.replace("3840 × 2160 px", "2160 × 3840 px")
    .replace(
        "16:9 horizontal hero-banner composition",
        "9:16 vertical mobile hero-banner composition",
    )
    .replace(
        "Does the image work as a 16:9 eCommerce homepage hero?",
        "Does the image work as a 9:16 mobile eCommerce homepage hero?",
    )
    .replace(
        "Generate ONE finished 3840 × 2160 premium cinematic eCommerce hero banner.",
        "Generate ONE finished 2160 × 3840 premium cinematic eCommerce mobile hero banner.",
    )
    + """

==================================================
VERTICAL MOBILE COMPOSITION
==================================================

Compose this natively as a 9:16 portrait mobile homepage hero.
Do NOT crop, squeeze, or letterbox a 16:9 wide banner into a tall frame.
Keep the product LARGE and PROPERLY CENTERED in the tall frame.
Build the same bold classy cinematic atmosphere above and below the product.
Place the single classy text accent in the quiet upper zone (or soft lower band) — never on the product.
Keep type refined and slightly smaller on mobile so the product stays dominant.

==================================================
MOBILE COLOR LOCK — CRITICAL
==================================================

Mobile hero product colors MUST MATCH the uploaded product AND the desktop/web hero colorway.

HARD RULES:
- Do NOT invent a different product color for mobile.
- Do NOT apply stronger color grading on mobile that shifts product hue/saturation.
- Do NOT make metals warmer/cooler, plastics neon, or fabrics a new shade vs the upload.
- Keep the SAME true product colors as the reference photo; only the frame aspect (9:16) changes.
- If mobile lighting differs, adjust BACKGROUND lighting only — product base colors stay locked.

If the mobile product looks like a different color than the upload / web hero, FIX THE COLORS before finishing.
"""
).strip()

CINEMATIC_PRODUCT_STORY_PROMPT = """
Create a SUPER-PREMIUM CINEMATIC PRODUCT STORY still using the uploaded product image as the EXACT visual reference.

FINAL OUTPUT:
- 1:1 square
- Ultra-sharp, photorealistic commercial advertising quality
- More powerful, more striking, and more "campaign key visual" than a standard catalog shot
- Premium global-brand aesthetic

==================================================
PRODUCT IS THE HERO — MAKE IT POWERFUL
==================================================

The product is the PRIMARY and DOMINANT subject.

Make this image feel BOLD and IMPORTANT at first glance:
- large product scale
- strong cinematic contrast
- dramatic but controlled lighting
- rich depth and atmosphere
- premium material rendering
- the product should feel iconic, expensive, and unforgettable

The viewer's eye must hit the product immediately.

==================================================
PRODUCT PRESERVATION — EXTREMELY IMPORTANT
==================================================

Preserve the actual product faithfully:
exact shape, proportions, construction, materials, colors,
buttons, ports, cables, caps, accessories, packaging, and legitimate branding.

DO NOT redesign, modernize, simplify, add/remove features, invent parts, or distort.

==================================================
SCENE — HIGH PRODUCTION, NOT FLAT
==================================================

Create a powerful editorial product-story environment with real visual weight:
rich lighting gradients, dramatic shadow falloff, reflective surfaces,
subtle atmospheric depth (soft rays, glow, haze, texture) so the image feels
like a top-tier campaign still — never a plain empty backdrop.

Keep the scene uncluttered. No busy lifestyle chaos.
1–3 subtle category-relevant atmosphere cues only.

TECH: dark cinematic engineered surfaces, controlled energy light
AUDIO: studio atmosphere, subtle sound-inspired forms
BEAUTY: luxury spa/editorial glow, serum/water/stone
KITCHEN: premium culinary surface, steam, ingredients far behind
HOME: architectural interior depth
FASHION: high-fashion studio / fabric atmosphere
JEWELRY: macro luxury sparkle, polished stone
FITNESS: powerful performance lighting
AUTOMOTIVE: carbon, metal, dramatic garage light
OUTDOOR: cinematic landscape depth
FOOD: premium food-advertising atmosphere
OTHER: infer a premium category-true environment

Category cues stay BEHIND the product and must never hide branding.

==================================================
COMPOSITION
==================================================

Square 1:1. Product centered or slightly off-center.
Generous negative space. Clean contact shadow.
No text overlays. No fake logos. No slogans. No CTAs.

LIGHTING: cinematic, high-impact, product brighter than the environment.
COLOR: built from the product's real colors plus one restrained accent.

Generate ONE finished 1:1 premium cinematic product-story image.
""".strip()

CINEMATIC_WHY_SHOP_PROMPT = """
Create a SUPER-PREMIUM CINEMATIC "WHY SHOP" image using the uploaded product image as the EXACT visual reference.

FINAL OUTPUT:
- 1:1 square
- Fill the full square frame (NOT a circle crop)
- Photorealistic commercial lifestyle photography
- Warm human presence — someone actually using, holding, wearing, applying, or living with the product

==================================================
HUMAN TOUCH — REQUIRED
==================================================

Include ONE real person interacting with the product in a natural, believable way
that matches what this product actually is.

Choose the most logical interaction automatically:

TECH / ELECTRONICS / AUDIO: holding, wearing, or using the device in a real moment
BEAUTY / SKINCARE / HAIR / MAKEUP: applying or holding it during a real routine
KITCHEN / FOOD PREP: using it while cooking or preparing food
HOME / LIVING / FURNITURE: using or living with it in a real interior
FASHION / ACCESSORIES: wearing it
JEWELRY / WATCHES: wearing it on wrist/neck/hand (product still sharp)
FITNESS / SPORTS: using it during training or recovery
AUTOMOTIVE: using or installing it in a real vehicle context
OUTDOOR / TRAVEL: using it on the go
FOOD / BEVERAGE: holding, pouring, or serving it
PET: person with pet using/holding the product
BABY / KIDS: age-appropriate, safe, natural use (no unsafe posing)
OTHER: the most natural "someone has this / uses this" moment

The person should look real, not like cheap stock:
natural expression, authentic posture, premium but lived-in setting.
Hands/face/body may be in frame; the person is supporting the story, not replacing the product.

==================================================
PRODUCT MUST STAY CLEAR
==================================================

The product must remain clearly visible, identifiable, and sharp.
Preserve exact shape, materials, colors, and branding.
Do NOT cover the label with hands.
Do NOT redesign the product.

==================================================
SQUARE FRAME COMPOSITION
==================================================

Compose for a squared 1:1 rectangular panel — NOT a circle crop.
Fill the frame edge-to-edge. Corners may contain background/lifestyle detail.
Do NOT leave a circular safe zone.

Premium lighting. Shallow-to-moderate depth of field.
Product is the sharpest element; human can be slightly softer if needed.

No text, no fake logos, no slogans, no CTAs, no clutter.

Generate ONE finished 1:1 cinematic why-shop image with a human using the product.
""".strip()

CIRCLE_FEATURE_PROMPT_SUFFIX = """

CIRCULAR FRAME COMPOSITION (required):
Compose this shot so the product sits fully inside a centered circular safe area.
Leave comfortable padding from the edges so a perfect circle crop (1:1, CSS border-radius 50%)
never cuts off the product. Center the hero product. Soft, even background that looks premium
when masked into a circle. No important detail near corners.
""".strip()

WHY_SHOP_SQUARE_PROMPT_SUFFIX = """

RECTANGULAR / SQUARE FRAME COMPOSITION (required):
Compose for a squared (1:1) or tall rectangular product panel — NOT a circle crop.
Fill the frame edge-to-edge with a premium product/lifestyle shot. Product may sit
slightly off-center. Use the full square frame; corners may contain background detail.
Do NOT leave a circular safe zone or compose as if the image will be masked into a circle.
""".strip()

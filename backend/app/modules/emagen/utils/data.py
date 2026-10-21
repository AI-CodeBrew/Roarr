"""
Shotpack Data Library
====================

Centralized data for all 12 shotpack combinations.
Migrated from C1 Lock for use across all shotpack APIs.

All recipes, poses, appearances, and body types in one place for easy updates.
This replaces scattered definitions across multiple files.
"""

from typing import Dict, Any, List

# =============================================================================
# RECIPE STYLES
# =============================================================================

RECIPE_STYLES: Dict[str, Dict[str, Any]] = {
    "studio-clean": {
        "summary": "Seamless neutral studio; soft wrap lighting; grounded, realistic shadow; ecommerce-true colors.",
        "bg": "neutral seamless (white/very light grey), no gradients, no props",
        "lighting": "large softbox feel; gentle falloff; no harsh speculars",
        "dof": "deep DOF; garment crisp throughout",
        "composition": "center-weighted, minimal perspective distortion, straight verticals",
        "shadow": "soft, under-feet/under-chair only; no cutout halo",
    },
    "street-style": {
        "summary": "Outdoor urban context; soft golden-hour or bright overcast; shallow DOF; believable ground contact.",
        "bg": "clean architectural hints or textured wall; no brand signage; subtle bokeh",
        "lighting": "directional but soft; warm tone acceptable",
        "dof": "moderate/shallow DOF to separate subject",
        "composition": "more negative space; mild angle variety; candid feel",
        "shadow": "realistic contact shadows; no floating subject",
    },
    "cafe-lifestyle": {
        "summary": "Indoor café vibe; warm ambient; seated or leaning; shallow DOF; cozy yet product-forward.",
        "bg": "window light, table/sofa hints; uncluttered; no food props overlapping garment",
        "lighting": "soft window key; warm fill; avoid color casts on garment",
        "dof": "shallow DOF to keep garment readable, background soft",
        "composition": "seated three-quarter plus clean front/back; natural hand placement",
        "shadow": "subtle under-table/seat shadow, consistent with light",
    },
    "studio-color-pop": {
        "summary": "Seamless colored backdrop with bold but tasteful hue; high-key light for crisp catalog edges.",
        "bg": "full seamless color (brand-aligned), no props, no gradients",
        "lighting": "two big soft sources, slight wrap, minimal speculars",
        "dof": "deep DOF; garment fully sharp",
        "composition": "center-weighted, clean verticals; classic catalog",
        "shadow": "soft floor contact shadow; short and diffused"
    },
    "editorial-highkey": {
        "summary": "Near-white environment; airy wrap; gentle glow while keeping texture fidelity.",
        "bg": "white to very light grey, subtle environment bounce",
        "lighting": "wraparound soft high-key; lifted shadows",
        "dof": "moderate; subject crisp, background lightly softened",
        "composition": "breathing space around subject; modern editorial",
        "shadow": "minimal but present under feet—avoid 'floating'"
    },
    "editorial-lowkey": {
        "summary": "Moody side light with controlled contrast; deeper tones without crushing blacks.",
        "bg": "charcoal/black gradient, negative fill on far side",
        "lighting": "single key from 30–45° + subtle rim; crisp falloff",
        "dof": "moderate; texture preserved on garments",
        "composition": "rule-of-thirds bias; asymmetric stance ok",
        "shadow": "defined, directionally consistent, not harsh"
    },
    "beach-sunset": {
        "summary": "Warm golden-hour sun, long soft shadows; relaxed lifestyle.",
        "bg": "shoreline hints, clean horizon, no busy crowds",
        "lighting": "golden, directional; soft speculars; warm fill",
        "dof": "shallow/moderate; background bokeh",
        "composition": "more negative space; walking or relaxed stance",
        "shadow": "long, soft; consistent with sun direction"
    },
    "sports-court": {
        "summary": "Outdoor sport vibe; punchy sunlight with gentle bounce; energetic but product-forward.",
        "bg": "court lines/texture; uncluttered; no branding",
        "lighting": "harder key + bounce fill; crisp edges",
        "dof": "moderate; readable textures",
        "composition": "dynamic but controlled; stable camera height",
        "shadow": "crisp, short; consistent direction"
    },
    "home-minimal": {
        "summary": "Clean interior with daylight; wood floor + white wall; cozy but uncluttered.",
        "bg": "white wall, wood floor, soft interior cues; no props near garment",
        "lighting": "window key + soft fill; neutral WB",
        "dof": "moderate; background softened, garment clear",
        "composition": "centered / slight thirds; seated option for dresses/outerwear",
        "shadow": "soft floor contact; natural indoor diffusion"
    },
    "loft-natural": {
        "summary": "Large-window backlight with gentle contrast; authentic daylight feel.",
        "bg": "industrial loft/window shapes; soft bloom",
        "lighting": "backlit with soft frontal fill; gentle rim on edges",
        "dof": "moderate; slight halation acceptable",
        "composition": "front_mid included for tops; modern editorial",
        "shadow": "soft and feathered; no cutout halo"
    },
    "night-boulevard": {
        "summary": "City night bokeh; controlled exposure so garments don't go under.",
        "bg": "streetlights/bokeh; no signs/logos readable",
        "lighting": "key with subtle rim; lift exposure on garments",
        "dof": "shallow; strong separation via bokeh",
        "composition": "subject brighter than background; clean silhouette",
        "shadow": "subtle ground shadow; avoid 'floating'"
    },
    "garden-daylight": {
        "summary": "Cool daylight with foliage bokeh; fresh outdoor feel.",
        "bg": "greenery/hedge depth; uncluttered foreground",
        "lighting": "open shade or overcast; soft and even",
        "dof": "shallow/moderate; foliage bokeh",
        "composition": "calm, centered; fabric visibility first",
        "shadow": "soft/short; avoid dappled blotches on garment"
    },
    "studio-porcelain-highkey": {
        "summary": "Ultra-clean white studio for crisp e-commerce pop without clipping highlights.",
        "bg": "pure seamless white; no texture; no props",
        "lighting": "three soft sources; high-key fill with subtle specular control",
        "dof": "deep DOF; garment and edges tack sharp",
        "composition": "center-weighted; strict verticals; full-body or 3/4",
        "shadow": "tight, diffused floor contact; almost floating"
    },
    "studio-ink-lowkey": {
        "summary": "Dramatic low-key studio for saturated colors and sculpted form.",
        "bg": "charcoal seamless; no gradients; no props",
        "lighting": "soft key + feathered rim; low-key contrast with controlled blacks",
        "dof": "deep DOF on subject; background subtly falloff",
        "composition": "center-weighted; slight negative space above head",
        "shadow": "short, soft contact; faint wrap into backdrop"
    },
    "studio-dual-gel-edge": {
        "summary": "Modern studio with tasteful color gel edges for premium separation without overpowering the fabric.",
        "bg": "neutral seamless (warm gray); no props",
        "lighting": "large soft key + two subtle gelled rims (complimentary hues) for edge separation",
        "dof": "deep DOF on garment; slight falloff on background",
        "composition": "centered; clean verticals; leave 5–10% breathing room",
        "shadow": "soft, short floor contact; no multiple shadows"
    },
    "loft-northlight": {
        "summary": "Daylight loft look—natural, airy, and editorial while staying catalog-legible.",
        "bg": "soft plaster wall / big north-facing window hint; no furniture clutter",
        "lighting": "broad window key + subtle bounce fill; natural, low specular",
        "dof": "moderate DOF; subject crisp; background gently softened",
        "composition": "center-weighted; verticals corrected; modest negative space",
        "shadow": "soft floor shadow consistent with window direction"
    },
    "urban-cement-overcast": {
        "summary": "Streetwear-ready overcast city vibe with zero clutter and full garment readability.",
        "bg": "clean concrete wall or wide sidewalk; no signage; no crowds",
        "lighting": "open-shade/overcast top-light; minimal speculars",
        "dof": "shallow-to-moderate; gentle street bokeh",
        "composition": "center on plumb verticals; horizon straight",
        "shadow": "soft, diffuse ground contact; no hard double shadows"
    },
    "coast-fog-horizon": {
        "summary": "Moody coastal minimalism—soft contrast and calm palette for sophisticated looks.",
        "bg": "misty coastline; clean horizon; no boats/crowds",
        "lighting": "ambient softbox sky; cool fill with slight warm kicker",
        "dof": "shallow/moderate; creamy fog bokeh behind subject",
        "composition": "center-weighted; horizon at upper third; clean verticals",
        "shadow": "very soft, elongated; consistent with ambient sky"
    },
    "desert-golden-rim": {
        "summary": "Sun-kissed rim light with room to shift camera position for parallax.",
        "bg": "open desert/dune suggestion; no footprints within 1m of subject",
        "lighting": "low sun rim + soft front fill; warm tone; keep face neutral (no orange cast)",
        "dof": "moderate; subject crisp; dunes softly graduated",
        "composition": "subject may be centered for anchor ONLY; follow-ups allow 1/3 offsets; keep horizon level (±0.5°)",
        "shadow": "long, soft-edged; direction consistent with sun azimuth"
    },
    "neon-rain-night": {
        "summary": "Cinematic night energy—neon vibe with clean skin/garment color accuracy.",
        "bg": "subtle wet street with distant neon bokeh; no readable logos",
        "lighting": "soft neutral key + controlled neon spill; keep skin tones natural",
        "dof": "shallow; strong bokeh separation; subject fully sharp",
        "composition": "center-weighted; keep verticals straight; extra headroom for bokeh",
        "shadow": "soft reflection on wet ground; no harsh multi-shadows"
    },
    
    # ---------- NON-GARMENT PRODUCT RECIPES ----------
    "studio-glow-clarity": {
        "summary": "High-key studio setup emphasizing product texture, gloss, and purity—ideal for skincare, makeup, or wellness products.",
        "bg": "Seamless white or very light neutral backdrop with soft surface reflections.",
        "lighting": "Diffuse 3-point lighting with a beauty dish key light above and two soft fills; gentle backlight for bottle edges or skin glow.",
        "dof": "Shallow (f/2.8–4) for soft background separation; focus on product or face area.",
        "composition": "Centered or slightly offset composition; symmetry emphasized for cleanliness.",
        "shadow": "Feathered soft shadows directly below or behind product; minimal contrast."
    },
    "vanity-lifestyle": {
        "summary": "Natural morning vanity scene emphasizing real-world use—mirrors, wood, and daylight tones.",
        "bg": "Bathroom or bedroom vanity setup with clean surfaces and small accessories.",
        "lighting": "Window daylight key from side; soft reflector bounce for fill; maintain realistic warmth.",
        "dof": "Moderate (f/4–5.6) to keep environment readable but product dominant.",
        "composition": "Rule-of-thirds framing; visible reflection optional; human interaction preferred.",
        "shadow": "Natural directional daylight shadows; soft transitions."
    },
    "macro-texture-focus": {
        "summary": "Close-up macro detail emphasizing texture—cream consistency, shimmer, packaging surface.",
        "bg": "Minimal plain surface; color matched to product family (e.g., beige, nude, pastel).",
        "lighting": "Small diffused LED or ring light at shallow angle to reveal microtexture.",
        "dof": "Very shallow (f/2–3.2); focus plane on texture or logo emboss.",
        "composition": "Tight framing, product filling frame edge-to-edge.",
        "shadow": "Subtle gradient shadow to suggest form depth."
    },
    "home-countertop-daylight": {
        "summary": "Lifestyle kitchen countertop setup using daylight to evoke real-use environment.",
        "bg": "Bright modern kitchen background—clean counter, subtle props like fruit or cups.",
        "lighting": "Natural window key with reflector fill; optional top fill for appliance sheen.",
        "dof": "Moderate (f/4–5.6) for context while emphasizing appliance body.",
        "composition": "Three-quarter product angle showing controls and size; human hand optional.",
        "shadow": "Soft daylight shadow to right or back, maintaining realism."
    },
    "studio-appliance-focus": {
        "summary": "Controlled studio product shot highlighting form and finish; ideal for catalogs.",
        "bg": "Seamless neutral gray or white with slight gradient background.",
        "lighting": "Large softbox key 45° from front, smaller kicker for edge highlight.",
        "dof": "Deep (f/8–11) to keep entire appliance sharp.",
        "composition": "Centered or 3/4 perspective; full visibility of logo and features.",
        "shadow": "Crisp but faint shadow under base; slight rear reflection optional."
    },
    "result-lifestyle": {
        "summary": "Appliance shown post-use with results—fresh juice, baked bread, vacuumed carpet.",
        "bg": "Kitchen or living setting with completed output neatly arranged.",
        "lighting": "Daylight or warm studio light; mild diffusion to maintain realism.",
        "dof": "Moderate (f/4–5.6).",
        "composition": "Include appliance + output result; emphasize satisfaction or cleanliness.",
        "shadow": "Natural low-contrast shadows consistent with ambient source."
    },
    "studio-tech-reflect": {
        "summary": "Sleek, modern reflective setup emphasizing materials, edges, and technology precision.",
        "bg": "Glossy black or charcoal reflective acrylic base with neutral gradient background.",
        "lighting": "Directional strip lighting; controlled highlights along edges; subtle rim light.",
        "dof": "Deep (f/8–11) to maintain full sharpness on product contours.",
        "composition": "Centered hero shot or low-angle 3/4; focus on industrial design.",
        "shadow": "Tight, mirror-like shadow/reflection; high precision."
    },
    "workspace-natural": {
        "summary": "Real-life usage in work/study setting—showing product integration in daily life.",
        "bg": "Desk with laptop, notebook, ambient decor; blurred background.",
        "lighting": "Window daylight + desk lamp fill; natural falloff.",
        "dof": "Shallow (f/2.8–4) with focus on device or user hands.",
        "composition": "Rule-of-thirds, diagonal layout, ergonomic interaction emphasized.",
        "shadow": "Soft natural shadows along device contours."
    },
    "feature-highlight-macro": {
        "summary": "Macro composition showing craftsmanship or UI—ports, buttons, texture, screen detail.",
        "bg": "Neutral matte surface or solid color accent (black, silver, navy).",
        "lighting": "Small controlled LED panels or ring light; side illumination for edges.",
        "dof": "Very shallow (f/2.8).",
        "composition": "Extreme close-up, product occupies full frame.",
        "shadow": "Minimal, soft gradient for depth cue."
    },
    "playroom-daylight": {
        "summary": "Bright, cheerful playroom environment with natural daylight—ideal for toys and learning tools.",
        "bg": "Soft pastel walls, shelves, rugs, child-friendly setting.",
        "lighting": "Large diffuse daylight; bounce fill to eliminate harsh contrasts.",
        "dof": "Moderate (f/4–5.6) to show both child and product.",
        "composition": "Wide to mid shot; emphasize fun and engagement.",
        "shadow": "Soft and diffused; consistent with daylight."
    },
    "safety-demo-studio": {
        "summary": "Neutral studio setup focused on safety and design clarity—ideal for baby gear and accessories.",
        "bg": "Seamless white or very light neutral tone.",
        "lighting": "Even soft lighting with frontal key and top fill; avoids harsh edges.",
        "dof": "Deep (f/8–11) for full product clarity.",
        "composition": "Full product shot with child model or adult hand indicating safe use.",
        "shadow": "Soft base shadow directly under product."
    },
    "learning-lifestyle": {
        "summary": "Warm indoor setup emphasizing education and family bonding.",
        "bg": "Living room or classroom-like space; soft neutral colors and books visible.",
        "lighting": "Natural warm key + bounce fill; daylight tone.",
        "dof": "Moderate (f/3.5–5).",
        "composition": "Eye-level or slightly above; capture interaction and emotion.",
        "shadow": "Soft, natural, minimal contrast."
    },
    "studio-neutral": {
        "summary": "Universal clean studio setup for catalog presentation—applies to books, jewelry, office items, tools.",
        "bg": "White or light gray seamless paper; optional subtle gradient.",
        "lighting": "Softbox frontal key + overhead fill; consistent exposure.",
        "dof": "Deep (f/8–11) for full product sharpness.",
        "composition": "Centered hero composition, isolated on white.",
        "shadow": "Soft drop shadow beneath product for realism."
    },
    "desk-flatlay": {
        "summary": "Overhead flatlay for small products or sets; perfect for stationery, jewelry, cosmetics.",
        "bg": "Textured or solid matte surface (wood, marble, paper).",
        "lighting": "Diffuse top lighting; even exposure across frame.",
        "dof": "Deep (f/8–11).",
        "composition": "Top-down perfectly aligned or casual scatter for lifestyle tone.",
        "shadow": "Soft radial falloff shadows; consistent light direction."
    },
    "industrial-contrast": {
        "summary": "Dramatic low-key setup highlighting durability or craftsmanship—suitable for tools or automotive items.",
        "bg": "Dark matte or metal surface; subtle back gradient.",
        "lighting": "Hard key from 45° with rim light; accentuating form and edges.",
        "dof": "Deep (f/8).",
        "composition": "Low angle 3/4 view; focus on detail and brand marks.",
        "shadow": "Strong controlled shadow opposite light source."
    }
}

# =============================================================================
# POSE DEFINITIONS
# =============================================================================

# Pose atoms - detailed rules, numeric directives, and minimal negatives
POSE_ATOMS: Dict[str, Dict[str, Any]] = {

    # ---------- FULL-BODY (STATIONARY) ----------
    "front_full": {
        "directives": {
            "camera_height": "navel_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "shoulder_ratio_range": [0.92, 1.08],
            "stance": "feet_parallel_weight_balanced"
        },
        "rules": (
            "Full body; square to camera (yaw ≤5°). Knees relaxed. Arms along seams; hands soft. "
            "Hem level. 3–8% headroom; both feet fully planted."
        ),
        "negatives": "no walking/stride, no step-in-progress, no exaggerated sway, no cropped head/feet"
    },

    "three_quarter_full": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [25, 40], "target": 32},
            "head_yaw_deg": {"range": [10, 22], "target": 16},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [28, 42], "target": 35},
            "shoulder_ratio_range": [0.60, 0.85],
            "ear_visibility": "one_clear_other_occluded",
            "stance": "weight_on_back_leg_front_half_step"
        },
        "composition_override": {
            "subject_offset_x": {"range": [0.18, 0.28], "target": 0.22},
            "camera_truck_x": {"range": [-0.22, -0.14], "target": -0.18},
            "camera_distance_scale": {"range": [0.95, 1.02], "target": 0.98}
        },
        "rules": (
            "Body angled ~35°. Weight on back leg; front leg half-step forward; elbows soft; far-side contour visible. "
            "3–8% headroom."
        ),
        "negatives": "no square-to-camera shoulders, no perfectly parallel feet, no cropped head"
    },

    "side_full": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [82, 98], "target": 90},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},  # head neutral relative to torso
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [82, 98], "target": 90},
            "shoulder_ratio_range": [0.40, 0.65],
            "ear_visibility": "profile_side_clear",
            "stance": "feet_stacked_natural"
        },
        "rules": (
            "True profile. Full body with both feet visible (near foot leading slightly). "
            "Spine tall; shoulders relaxed; arms along seams. Maintain clean side silhouette; "
            "keep hem vertical and readable."
        ),
        "negatives": "no torso twist beyond ±10°, no hunched shoulders, no cropped head/feet"
    },

    "back_full": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "shoulder_ratio_range": [0.92, 1.08],
            "ear_visibility": "nape_and_hairline_clear",
            "stance": "feet_parallel_weight_balanced"
        },
        "rules": (
            "Back view, shoulders/hips square to camera. Arms relaxed; hands near side seams. "
            "Reveal back details: neckline, closures, yoke, seam lines. Hemline level; "
            "both feet visible; include 3–8% headroom."
        ),
        "negatives": "no torso twist >10°, no hair blocking key back details, no cropped head/feet"
    },

    # ---------- FULL-BODY (MOTION) ----------
    "walking_three_quarter": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [16, 32], "target": 24},
            "head_yaw_deg": {"range": [6, 18], "target": 12},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [20, 36], "target": 28},
            "ear_visibility": "one_clear_other_occluded",
            "lead_foot": "near_heel_down_far_heel_lifted",
            "step_length_ratio": {"min": 0.06, "max": 0.14},
            "arm_swing": "subtle_opposite_to_legs"
        },
        "composition_override": {
            "subject_offset_x": {"range": [-0.28, -0.18], "target": -0.22},
            "camera_truck_x": {"range": [0.18, 0.28], "target": 0.22},
            "camera_distance_scale": {"range": [1.02, 1.10], "target": 1.06}
        },
        "rules": (
            "3/4 angle (30–45°). Mid-stride: near heel down, far heel lifted; subtle opposite arm swing; chin neutral. "
            "Garment motion crisp. 3–8% headroom."
        ),
        "negatives": "no parallel planted feet, no square shoulders, no cropped head, no motion blur"
    },

    # ---------- DETAILS / CROPS ----------
    "detail_neckline": {
        "directives": {
            "framing": "tight_on_neckline_shoulders_visible",
            "camera_height": "chest_level",
            "head_yaw_deg": {"range": [-4, 4], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Tight on neckline/trim; shoulders parallel; neutral chin. Even lighting; "
            "horizon level. Include full neckline and stitch detail; do not crop at mouth."
        ),
        "negatives": "no oblique skew, no harsh shadow, no crop cutting neckline or mouth"
    },

    "detail_sleeve_cuff": {
        "directives": {
            "framing": "tight_on_cuff_and_sleeve_head",
            "camera_height": "mid_torso_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Frame the sleeve head to cuff; show cuff closure (buttons/zip) and top-stitching. "
            "Fabric texture sharp; avoid perspective skew."
        ),
        "negatives": "no blown highlights on cuff, no crop cutting hardware"
    },

    "detail_hem": {
        "directives": {
            "framing": "tight_on_hemline",
            "camera_height": "hem_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Tight on hemline; show stitching, vents/slits, lining if present. "
            "Keep hem level and perpendicular verticals; texture crisp."
        ),
        "negatives": "no tilted horizon, no out-of-focus hem, no crop through vent"
    },

    "detail_closure": {
        "directives": {
            "framing": "tight_on_zip_or_buttons",
            "camera_height": "feature_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Close crop of closure (zip, buttons, hooks). Angle so hardware is legible; "
            "avoid specular clipping; show stitch line continuity."
        ),
        "negatives": "no glare on hardware, no crop cutting top/bottom of closure"
    },

    # ---------- HAND/ARM VARIATIONS ----------
    "hands_pockets_full": {
        "directives": {
            "camera_height": "navel_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "ear_visibility": "natural_for_hairstyle",
            "stance": "feet_parallel_weight_balanced",
            "hands_in_pockets": "thumbs_out_light_entry"
        },
        "rules": (
            "Full body; natural weight shift. One or both hands lightly inside pockets (thumbs out). "
            "Elbows soft; keep pocket opening and seam visible. Include 3–8% headroom."
        ),
        "negatives": "no deep hands bulging fabric, no elbows locked, no cropped head"
    },

    "hand_on_hip_three_quarter": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [25, 40], "target": 32},
            "head_yaw_deg": {"range": [8, 18], "target": 12},
            "torso_yaw_deg": {"range": [28, 42], "target": 35},
            "ear_visibility": "one_clear_other_occluded",
            "hand_on_hip": "near_hand_resting_light_no_splay",
            "stance": "weight_on_back_leg_front_half_step"
        },
        "rules": (
            "3/4 body angle (30–45°). Near hand resting lightly on hip (no finger splay); "
            "other arm relaxed. Keep waist seam and side panel readable."
        ),
        "negatives": "no aggressive fashion pose, no square shoulders, no splayed fingers"
    },

    # ---------- NEW: VARIATION-SAFE FULL-BODY ----------
    "contrapposto_front": {
        "directives": {
            "camera_height": "navel_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "shoulder_ratio_range": [0.90, 1.05],
            "stance": "contrapposto_weight_shift"
        },
        "rules": (
            "Front view with natural weight shift (contrapposto). One knee relaxed; hips level;"
            " elbows soft; fingers together. Hem level; 3–8% headroom."
        ),
        "negatives": "no runway sway, no locked knees, no cropped head/feet"
    },

    "walking_front_subtle": {
        "directives": {
            "camera_height": "navel_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-4, 4], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "torso_yaw_deg": {"range": [-6, 6], "target": 0},
            "lead_foot": "near_heel_down_far_toe_touch",
            "step_length_ratio": {"min": 0.03, "max": 0.08},
            "arm_swing": "micro_opposite"
        },
        "rules": (
            "Frontal micro-walk to add life without turning the torso. Near heel down, far toe touch;"
            " tiny opposite arm swing; fabric motion crisp (no blur)."
        ),
        "negatives": "no big stride, no torso yaw >6°, no motion blur"
    },

    "back_three_quarter": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [140, 160], "target": 150},
            "head_yaw_deg": {"range": [-14, -6], "target": -10},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "torso_yaw_deg": {"range": [140, 160], "target": 150},
            "shoulder_ratio_range": [0.55, 0.80],
            "ear_visibility": "one_clear_other_occluded",
            "stance": "weight_on_back_leg_front_half_step"
        },
        "rules": (
            "Back three-quarter: show rear panels/closures while giving a hint of face."
            " Keep far shoulder narrower; neckline/yoke readable; hem level; both feet visible."
        ),
        "negatives": "no square back, no full front face, no cropped head/feet"
    },

    "over_shoulder_three_quarter_back": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [120, 150], "target": 135},
            "head_yaw_deg": {"range": [-24, -12], "target": -16},
            "head_pitch_deg": {"range": [-2, 4], "target": 1},
            "torso_yaw_deg": {"range": [120, 150], "target": 135},
            "ear_visibility": "one_clear_other_occluded",
            "stance": "feet_parallel_weight_balanced"
        },
        "rules": (
            "Over-shoulder: showcase back/shoulder seams and collar shape; a sliver of face ok."
            " Keep shoulder roll natural; collar/hood edges sharp."
        ),
        "negatives": "no aggressive twist >20°, no hair blocking collar detail"
    },

    "lean_three_quarter": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [25, 40], "target": 32},
            "head_yaw_deg": {"range": [8, 18], "target": 12},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [28, 42], "target": 35},
            "ear_visibility": "one_clear_other_occluded",
            "support_required": True,
            "support_kind_preference": ["wall_edge", "handrail", "pillar", "waist_high_bar"],
            "support_side": "far_side_of_camera",
            "support_contact": "upper_arm_or_shoulder_light_contact",
            "lean_angle_deg": {"range": [8, 16], "target": 12},
            "center_of_mass_rule": "must_intersect_support_projection",
            "stance": "feet_staggered_toward_support",
            "lead_foot": "near_foot_closer_to_support_planted",
            "weight_distribution": "70_on_support_side_foot_30_other"
        },
        "composition_override": {
            "subject_offset_toward_support": {"range": [0.12, 0.22], "target": 0.16},
            "include_support_object_min_pct_of_frame_width": 0.10,
            "verticals_upright": True
        },
        "rules": (
            "Clear 3/4 angle with real support visible (wall edge/rail/pillar). Far-side shoulder/forearm lightly "
            "touches support; body leans ~10–15° while spine stays long. Feet staggered toward support; near foot carries "
            "most weight. Keep hem readable and verticals upright; include enough of the support to explain the lean."
        ),
        "negatives": (
            "no unsupported lean, no tilted horizon to simulate lean, no bent or collapsed spine, "
            "no hidden support outside frame, no motion blur"
        )
    },

    "crossed_ankles_front": {
        "directives": {
            "camera_height": "navel_level",
            "camera_orbit_azimuth_deg": {"range": [-6, 6], "target": 0},
            "head_yaw_deg": {"range": [-6, 6], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "head_roll_deg": {"range": [-2, 2], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "shoulder_ratio_range": [0.92, 1.08],
            "ear_visibility": "natural_for_hairstyle",
            "stance": "ankles_crossed_front_view",
            "ankle_crossing": {"allowed": ["right_over_left", "left_over_right"], "target": "natural_preferred"},
            "front_foot_contact": "toe_touch_only",
            "weight_distribution": "80_on_back_leg_20_on_front_toe",
            "knee_alignment": "soft_knees_no_knock_no_lock",
            "feet_angle_out_deg_each": {"range": [3, 12], "target": 8}
        },
        "rules": (
            "Front view with true ankle cross: one foot planted bearing most weight; the other crosses in front with a "
            "light toe touch. Knees soft (not locked), pelvis neutral, arms relaxed along seams. Hem level; 3–8% headroom."
        ),
        "negatives": (
            "no parallel feet, no gap at ankles, no crossing at knees instead of ankles, "
            "no excessive toe-in/toe-out, no cropped head/feet"
        )
    },

    # ---------- OPTIONAL ADD-ONS ----------
    "seated_three_quarter": {
        "directives": {
            "camera_height": "eye_level",
            "camera_orbit_azimuth_deg": {"range": [20, 35], "target": 28},
            "head_yaw_deg": {"range": [8, 16], "target": 12},
            "torso_yaw_deg": {"range": [20, 32], "target": 26},
            "leg_position": "one_knee_forward_other_relaxed",
            "hand_placement": "one_on_thigh_other_relaxed"
        },
        "rules": (
            "Seated 3/4: posture tall; hips slightly angled; knees offset; "
            "hands relaxed; maintain clean garment drape over lap and side seam visibility."
        ),
        "negatives": "no slouching, no cropped head, no fabric bunching that hides silhouette"
    },

    # ---------- NON-FASHION DETAIL POSES ----------
    "detail_logo": {
        "directives": {
            "framing": "tight_on_logo_branding",
            "camera_height": "logo_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Tight on product logo/branding; show text clarity and placement. "
            "Even lighting; horizon level. Include full logo and brand detail; do not crop at edges."
        ),
        "negatives": "no oblique skew, no harsh shadow, no crop cutting logo edges"
    },
    "detail_materials": {
        "directives": {
            "framing": "tight_on_material_surface",
            "camera_height": "surface_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Close crop of material surface; show texture, finish, and quality. "
            "Fabric/metal/plastic texture sharp; avoid perspective skew."
        ),
        "negatives": "no blown highlights on surface, no crop cutting material edges"
    },
    "detail_function": {
        "directives": {
            "framing": "tight_on_functional_features",
            "camera_height": "feature_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Close crop of functional features (buttons, controls, mechanisms). "
            "Angle so features are legible; avoid specular clipping; show operational details."
        ),
        "negatives": "no glare on controls, no crop cutting functional elements"
    },
    
    # ---------- HEALTH & BEAUTY PRODUCT POSES ----------
    "beauty_application": {
        "directives": {
            "framing": "medium_closeup",
            "camera_height": "eye_level",
            "head_yaw_deg": {"range": [-15, 15], "target": 0},
            "head_pitch_deg": {"range": [-5, 5], "target": 0},
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "product_interaction": "model applying cream, serum, or makeup visibly",
            "facial_expression": "calm, focused, natural"
        },
        "rules": (
            "Show realistic application technique; ensure product and action are clearly visible. "
            "Lighting should emphasize skin glow and clarity."
        ),
        "negatives": "no over-glamourization, no harsh light, no cluttered background"
    },
    
    "beauty_dresser_mirror": {
        "directives": {
            "framing": "three_quarter",
            "camera_height": "eye_level",
            "head_yaw_deg": {"range": [-20, 20], "target": 5},
            "head_pitch_deg": {"range": [-5, 5], "target": 0},
            "torso_yaw_deg": {"range": [-15, 15], "target": 10},
            "product_interaction": "model seen in mirror holding or using product",
            "facial_expression": "content or concentrating"
        },
        "rules": (
            "Include vanity/mirror reflection subtly; maintain natural light mood; product visible in reflection or direct."
        ),
        "negatives": "no messy background, no overexposure from mirror reflection"
    },
    
    "beauty_close_up_hands": {
        "directives": {
            "framing": "tight_on_hands_and_product",
            "camera_height": "hand_level",
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "product_focus": "hands_using_product_clearly_visible",
            "skin_texture": "natural_hand_skin_showing_product_interaction"
        },
        "rules": (
            "Close-up of hands using the beauty product. Product texture and application method clearly visible. "
            "Natural hand positioning showing proper usage. Focus on product-hand interaction and skin texture."
        ),
        "negatives": "no full body, no face focus, no product just sitting unused"
    },
    
    "beauty_before_after": {
        "directives": {
            "framing": "face_focus_showing_results",
            "camera_height": "face_level",
            "head_yaw_deg": {"range": [-10, 10], "target": 0},
            "head_pitch_deg": {"range": [-3, 3], "target": 0},
            "torso_yaw_deg": {"range": [-5, 5], "target": 0},
            "facial_expression": "satisfied_with_results",
            "product_visible": "in_hand_or_nearby_showing_usage"
        },
        "rules": (
            "Face-focused shot showing beauty results. Product visible in hand or nearby. "
            "Expression showing satisfaction with results. Clean, well-lit face showing product benefits. "
            "Natural beauty lighting that enhances skin appearance."
        ),
        "negatives": "no casual expressions, no outdoor sports settings, no product just sitting"
    },
    
    # ---------- ELECTRONICS & GADGETS POSES ----------
    "electronics_using_device": {
        "directives": {
            "framing": "upper_body_with_device_in_use",
            "camera_height": "chest_level",
            "head_yaw_deg": {"range": [-10, 10], "target": 0},
            "head_pitch_deg": {"range": [-5, 5], "target": 0},
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "device_interaction": "hands_actively_using_device",
            "screen_visibility": "device_screen_clearly_visible"
        },
        "rules": (
            "Upper body shot showing active device usage. Hands clearly interacting with device. "
            "Screen/interface visible and readable. Natural usage context. "
            "Shows device functionality and user engagement."
        ),
        "negatives": "no device just sitting unused, no casual poses without interaction"
    },
    
    "electronics_hands_holding": {
        "directives": {
            "framing": "close_up_hands_holding_device",
            "camera_height": "hand_level",
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "device_angle": "optimal_viewing_angle_for_device",
            "hands_positioning": "natural_holding_grip"
        },
        "rules": (
            "Close-up of hands holding the electronic device. Device clearly visible and properly held. "
            "Shows device size, weight, and ergonomics. Natural grip and handling. "
            "Focus on device design and user interaction."
        ),
        "negatives": "no full body shots, no device just sitting, no casual poses"
    },
    
    "electronics_feature_highlight": {
        "directives": {
            "framing": "tight_on_specific_device_features",
            "camera_height": "feature_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "feature_focus": "buttons_ports_screen_clearly_visible",
            "lighting": "even_illumination_no_glare"
        },
        "rules": (
            "Tight shot highlighting specific device features (buttons, ports, screen, etc.). "
            "Even lighting with no glare. Shows build quality and design details. "
            "Focus on functionality and craftsmanship."
        ),
        "negatives": "no harsh shadows, no glare on screen, no blurry features"
    },
    
    "electronics_lifestyle_context": {
        "directives": {
            "framing": "three_quarter_with_lifestyle_context",
            "camera_height": "eye_level",
            "head_yaw_deg": {"range": [20, 40], "target": 30},
            "torso_yaw_deg": {"range": [25, 45], "target": 35},
            "lifestyle_context": "desk_workspace_or_appropriate_setting",
            "device_usage": "natural_integration_into_daily_life"
        },
        "rules": (
            "Three-quarter shot showing device in lifestyle context (desk, workspace, etc.). "
            "Natural integration into daily routine. Shows how device fits into user's life. "
            "Appropriate setting for device type."
        ),
        "negatives": "no outdoor sports settings, no inappropriate contexts"
    },
    
    # ---------- KITCHEN & HOME APPLIANCES POSES ----------
    "kitchen_appliance_using": {
        "directives": {
            "framing": "upper_body_with_appliance_in_use",
            "camera_height": "chest_level",
            "head_yaw_deg": {"range": [-10, 10], "target": 0},
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "appliance_interaction": "hands_operating_appliance",
            "kitchen_context": "visible_kitchen_setting"
        },
        "rules": (
            "Upper body shot showing appliance in active use. Hands operating controls. "
            "Kitchen context visible. Shows appliance functionality and ease of use. "
            "Natural kitchen lighting and setting."
        ),
        "negatives": "no appliance just sitting unused, no non-kitchen settings"
    },
    
    "kitchen_appliance_control_panel": {
        "directives": {
            "framing": "tight_on_control_panel_and_interface",
            "camera_height": "control_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "control_visibility": "buttons_display_clearly_visible",
            "lighting": "even_illumination_no_glare"
        },
        "rules": (
            "Tight shot of appliance control panel and interface. All controls clearly visible. "
            "Shows build quality and user interface design. Even lighting with no glare. "
            "Focus on functionality and ease of operation."
        ),
        "negatives": "no harsh shadows, no glare on display, no blurry controls"
    },
    
    "kitchen_appliance_size_context": {
        "directives": {
            "framing": "full_appliance_with_size_reference",
            "camera_height": "appliance_mid_level",
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "size_reference": "hands_or_common_objects_for_scale",
            "kitchen_integration": "shows_how_it_fits_in_kitchen"
        },
        "rules": (
            "Full appliance shot showing size and scale. Hands or common objects for size reference. "
            "Shows how appliance fits in kitchen space. Demonstrates size and capacity. "
            "Kitchen context visible."
        ),
        "negatives": "no isolated shots without context, no inappropriate settings"
    },
    
    "kitchen_appliance_results": {
        "directives": {
            "framing": "showing_appliance_output_or_results",
            "camera_height": "results_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "results_focus": "food_output_or_cleaning_results_visible",
            "satisfaction_expression": "pleased_with_appliance_performance"
        },
        "rules": (
            "Shot showing appliance results (cooked food, clean dishes, etc.). "
            "Expression showing satisfaction with appliance performance. "
            "Results clearly visible and appealing. Shows appliance effectiveness."
        ),
        "negatives": "no appliance just sitting, no poor results, no inappropriate contexts"
    },
    
    # ---------- HOME & KITCHEN PRODUCTS POSES ----------
    "home_product_placement": {
        "directives": {
            "framing": "product_in_home_context",
            "camera_height": "product_level",
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "home_context": "appropriate_room_setting",
            "product_integration": "natural_placement_in_home"
        },
        "rules": (
            "Product shown in appropriate home context (living room, kitchen, bedroom, etc.). "
            "Natural placement and integration. Shows how product fits into home decor. "
            "Appropriate room setting for product type."
        ),
        "negatives": "no inappropriate room settings, no product just floating"
    },
    
    "home_product_materials": {
        "directives": {
            "framing": "tight_on_materials_and_craftsmanship",
            "camera_height": "material_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "material_focus": "texture_finish_quality_clearly_visible",
            "lighting": "enhances_material_appearance"
        },
        "rules": (
            "Tight shot highlighting materials and craftsmanship. Texture and finish clearly visible. "
            "Lighting that enhances material appearance. Shows quality and build. "
            "Focus on material quality and design details."
        ),
        "negatives": "no harsh shadows, no blurry materials, no poor lighting"
    },
    
    "home_product_function": {
        "directives": {
            "framing": "showing_product_functionality",
            "camera_height": "function_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "function_demonstration": "hands_using_product_as_intended",
            "usage_context": "appropriate_usage_setting"
        },
        "rules": (
            "Shot showing product being used as intended. Hands demonstrating functionality. "
            "Appropriate usage context. Shows product purpose and ease of use. "
            "Natural usage demonstration."
        ),
        "negatives": "no product just sitting unused, no inappropriate usage"
    },
    
    "home_product_lifestyle": {
        "directives": {
            "framing": "three_quarter_lifestyle_integration",
            "camera_height": "eye_level",
            "head_yaw_deg": {"range": [20, 40], "target": 30},
            "torso_yaw_deg": {"range": [25, 45], "target": 35},
            "lifestyle_context": "comfortable_home_setting",
            "product_benefit": "shows_how_product_enhances_life"
        },
        "rules": (
            "Three-quarter shot showing product in lifestyle context. Comfortable home setting. "
            "Shows how product enhances daily life. Natural home environment. "
            "Demonstrates product value and integration."
        ),
        "negatives": "no outdoor settings, no inappropriate contexts"
    },
    
    # ---------- KIDS PRODUCTS POSES ----------
    "kids_play_interaction": {
        "directives": {
            "framing": "child_actively_playing_with_product",
            "camera_height": "child_eye_level",
            "head_yaw_deg": {"range": [-10, 10], "target": 0},
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "child_engagement": "active_play_demonstration",
            "safety_context": "appropriate_supervision_implied"
        },
        "rules": (
            "Child actively playing with or using the product. Shows engagement and fun. "
            "Product clearly visible and in use. Safe play environment. "
            "Natural child behavior and interaction."
        ),
        "negatives": "no unsafe situations, no adult-only contexts, no inappropriate products"
    },
    
    "kids_safety_demonstration": {
        "directives": {
            "framing": "product_safety_features_highlighted",
            "camera_height": "product_safety_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "safety_focus": "child_safety_features_clearly_visible",
            "age_appropriateness": "clearly_shows_appropriate_age_range"
        },
        "rules": (
            "Product shown with safety features highlighted. Appropriate for child use. "
            "Safety elements clearly visible. Age-appropriate context. "
            "Shows product is safe for children."
        ),
        "negatives": "no unsafe products, no inappropriate age ranges, no dangerous situations"
    },
    
    "kids_educational_use": {
        "directives": {
            "framing": "child_learning_with_product",
            "camera_height": "child_learning_level",
            "head_yaw_deg": {"range": [-5, 5], "target": 0},
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "educational_context": "learning_environment_visible",
            "child_focus": "concentrated_learning_expression"
        },
        "rules": (
            "Child learning or being taught with the product. Educational context. "
            "Shows product's educational value. Child engaged in learning. "
            "Appropriate learning environment."
        ),
        "negatives": "no non-educational contexts, no inappropriate learning situations"
    },
    
    "kids_size_scale": {
        "directives": {
            "framing": "product_with_child_for_size_reference",
            "camera_height": "size_comparison_level",
            "torso_yaw_deg": {"range": [-15, 15], "target": 0},
            "size_reference": "child_clearly_visible_for_scale",
            "product_scale": "appropriate_size_for_child_use"
        },
        "rules": (
            "Product shown with child for size reference. Demonstrates appropriate scale. "
            "Shows product is right size for child. Clear size comparison. "
            "Child and product both clearly visible."
        ),
        "negatives": "no inappropriate sizing, no adult-only scale references"
    }
}


# Pose contrast policies for specific poses
POSE_CONTRAST_POLICIES: Dict[str, Dict[str, Any]] = {
    "three_quarter_full": {
        "min_torso_yaw_delta_vs_front_deg": 20,
        "checks": [
            "only one ear clearly visible",
            "apparent shoulder width ratio within 0.60–0.85 (far shoulder narrower)",
            "visible side seam or side panel on the turned side"
        ],
        "do_not_snap_to_front": True
    },
    "lean_three_quarter": {
        "requires_support_visible": True,
        "min_lean_angle_deg": 8,
        "checks": [
            "support object intersecting with shoulder/forearm",
            "verticals upright (no global image tilt)",
            "torso_yaw >= 28°"
        ],
        "do_not_snap_to_front": True
    },
    "crossed_ankles_front": {
        "ankle_cross_required": True,
        "forbid_parallel_feet": True,
        "weight_on_back_leg_required": True,
        "checks": [
            "front foot toe-only contact",
            "ankles touching or overlapping in projection"
        ],
        "do_not_snap_to_front": True
    }
}

# Detail crop policies for close-up shots
DETAIL_CROP_POLICIES: Dict[str, Dict[str, Any]] = {
    "default": {
        "subject": "garment_fabric_only",
        "target_fill_pct": [0.30, 0.60],
        "exclude_regions": ["face", "eyes", "nose", "mouth", "ears", "hair", "hands", "fingers", "neck", "legs"],
        "allow_skin_pixels": 0,
        "notes": "no disembodied human parts; show weave/stitch/panel only"
    },
    "detail_neckline": {
        "subject": "neckline stitching and immediate fabric",
        "target_fill_pct": [0.40, 0.75],
        "allowed_regions": ["neck edge", "lower chin strip", "lower lip edge"],
        "exclude_regions": ["eyes", "nose", "cheeks", "ears", "hair"],
        "face_fraction_max_pct_of_frame": 12,     # allow a thin band only
        "identity_required_if_face_present": True # if any chin/lip appears, it must match identity_reference
    }
}

# =============================================================================
# APPEARANCE PRESETS
# =============================================================================

APPEARANCES: Dict[str, Dict[str, Any]] = {
    "south_asian":      {"skin_tone":"medium-wheat","hair":"dark brown, straight/wavy","eyes":"brown","notes":"subtle kohl ok"},
    "south_east_asian": {"skin_tone":"tan-olive","hair":"dark brown, soft waves","eyes":"brown"},
    "middle_eastern":   {"skin_tone":"light-olive","hair":"dark, straight","eyes":"brown"},
    "east_asian":       {"skin_tone":"light-peach","hair":"black, straight","eyes":"brown"},
    "caucasian":        {"skin_tone":"fair","hair":"brown","eyes":"hazel/brown"},
    "african":          {"skin_tone":"deep-brown","hair":"coily/afro","eyes":"brown"},
    "latino":           {"skin_tone":"warm-olive","hair":"dark, wavy","eyes":"brown"},
    "neutral":          {"skin_tone":"neutral","hair":"neutral","eyes":"neutral"},
}

# =============================================================================
# BODY TYPES
# =============================================================================

BODY_TYPES: Dict[str, Dict[str, Any]] = {
    "petite":   {"height_hint":"5'0–5'3","proportions":"petite","notes":"shorter inseam"},
    "regular":  {"height_hint":"5'4–5'7","proportions":"regular"},
    "athletic": {"height_hint":"5'4–5'8","proportions":"athletic","notes":"defined shoulders"},
    "plus":     {"height_hint":"5'3–5'8","proportions":"plus","notes":"fuller hips/arms"},
}

# =============================================================================
# RECIPE POSE SETS (from V6)
# =============================================================================

RECIPE_POSE_SETS: Dict[str, Dict[str, List[str]]] = {
    # Studio: cleaner, calmer motion — avoid having both 3/4 + walking in a single garment flow.
    "studio-clean": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_full", "detail_collar"],
    },

    "street-style": {
        "top":    ["front_full", "walking_front_subtle", "hand_on_hip_three_quarter", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "three_quarter_full", "detail_fabric"],
        "dress":  ["front_full", "lean_three_quarter", "walking_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "walking_front_subtle", "detail_collar"],
    },

    "cafe-lifestyle": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "walking_front_subtle", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "contrapposto_front", "three_quarter_full", "detail_neckline"],
        "bottom": ["front_full", "side_full", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "studio-color-pop": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "crossed_ankles_front", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_full", "detail_collar"],
    },

    "editorial-highkey": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "side_full", "detail_logo"],
        "shirt":  ["front_full", "three_quarter_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "lean_three_quarter", "three_quarter_full", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "editorial-lowkey": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "beach-sunset": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "three_quarter_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "crossed_ankles_front", "detail_neckline"],
        "bottom": ["front_full", "side_full", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "sports-court": {
        "top":    ["front_full", "walking_front_subtle", "three_quarter_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "lean_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "walking_front_subtle", "detail_collar"],
    },

    "home-minimal": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "contrapposto_front", "three_quarter_full", "detail_neckline"],
        "bottom": ["front_full", "crossed_ankles_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_full", "detail_collar"],
    },

    "loft-natural": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "night-boulevard": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "lean_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "garden-daylight": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "crossed_ankles_front", "three_quarter_full", "detail_neckline"],
        "bottom": ["front_full", "side_full", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_full", "detail_collar"],
    },

    "studio-porcelain-highkey": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "contrapposto_front", "lean_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "crossed_ankles_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "studio-ink-lowkey": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "side_full", "detail_logo"],
        "shirt":  ["front_full", "three_quarter_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "studio-dual-gel-edge": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "lean_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },

    "loft-northlight": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "crossed_ankles_front", "three_quarter_full", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "urban-cement-overcast": {
        "top":    ["front_full", "lean_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "three_quarter_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],
        "bottom": ["front_full", "side_full", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "walking_front_subtle", "detail_collar"],
    },

    "coast-fog-horizon": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "crossed_ankles_front", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "desert-golden-rim": {
        "top":    ["front_full", "three_quarter_full", "back_full", "detail_logo"],   # no walking here
        "shirt":  ["front_full", "hands_pockets_full", "side_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "over_shoulder_three_quarter_back", "detail_neckline"],  # keep walking, drop 3/4
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "back_three_quarter", "detail_collar"],
    },

    "neon-rain-night": {
        "top":    ["front_full", "hand_on_hip_three_quarter", "back_full", "detail_logo"],
        "shirt":  ["front_full", "side_full", "hands_pockets_full", "detail_fabric"],
        "dress":  ["front_full", "walking_three_quarter", "lean_three_quarter", "detail_neckline"],
        "bottom": ["front_full", "contrapposto_front", "back_full", "detail_fabric"],
        "jacket": ["front_full", "over_shoulder_three_quarter_back", "three_quarter_full", "detail_collar"],
    },
}

# =============================================================================
# NON-FASHION PRODUCT CATEGORIES
# =============================================================================

NON_FASHION_PRODUCT_CATEGORIES = {
    "health_beauty": {
        "description": "Health and beauty products",
        "examples": ["skincare", "makeup", "supplements", "fitness", "wellness", "cosmetics", "personal_care"]
    },
    "kitchen_home_appliances": {
        "description": "Kitchen and home appliances",
        "examples": ["refrigerator", "microwave", "blender", "vacuum", "air_conditioner", "washing_machine", "dishwasher"]
    },
    "electronics_gadgets": {
        "description": "Electronics and gadgets",
        "examples": ["smartphone", "laptop", "headphones", "camera", "tablet", "smartwatch", "gaming_console"]
    },
    "kids": {
        "description": "Kids and children's products",
        "examples": ["toys", "children's_books", "educational_products", "baby_gear", "kids_furniture", "playground_equipment", "children_clothing_accessories"]
    },
    "other": {
        "description": "Other miscellaneous products",
        "examples": ["books", "toys", "automotive", "sports", "jewelry", "tools", "office_supplies"]
    }
}

# Non-fashion detail poses
NON_FASHION_DETAIL_POSES = {
    "detail_logo": {
        "directives": {
            "framing": "tight_on_logo_branding",
            "camera_height": "logo_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Tight on product logo/branding; show text clarity and placement. "
            "Even lighting; horizon level. Include full logo and brand detail; do not crop at edges."
        ),
        "negatives": "no oblique skew, no harsh shadow, no crop cutting logo edges"
    },
    "detail_materials": {
        "directives": {
            "framing": "tight_on_material_surface",
            "camera_height": "surface_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Close crop of material surface; show texture, finish, and quality. "
            "Fabric/metal/plastic texture sharp; avoid perspective skew."
        ),
        "negatives": "no blown highlights on surface, no crop cutting material edges"
    },
    "detail_function": {
        "directives": {
            "framing": "tight_on_functional_features",
            "camera_height": "feature_level",
            "torso_yaw_deg": {"range": [-10, 10], "target": 0},
            "ear_visibility": "not_required"
        },
        "rules": (
            "Close crop of functional features (buttons, controls, mechanisms). "
            "Angle so features are legible; avoid specular clipping; show operational details."
        ),
        "negatives": "no glare on controls, no crop cutting functional elements"
    }
}

# Non-fashion recipe pose sets
NON_FASHION_RECIPE_POSE_SETS = {
    "studio-clean": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "street-style": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "cafe-lifestyle": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "studio-color-pop": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "editorial-highkey": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "editorial-lowkey": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "beach-sunset": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "sports-court": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "home-minimal": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "loft-natural": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "night-boulevard": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "garden-daylight": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "studio-porcelain-highkey": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "studio-ink-lowkey": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "studio-dual-gel-edge": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "loft-northlight": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "urban-cement-overcast": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "coast-fog-horizon": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "desert-golden-rim": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    },
    "neon-rain-night": {
        "health_beauty": ["beauty_application", "beauty_dresser_mirror", "beauty_close_up_hands", "beauty_before_after"],
        "kitchen_home_appliances": ["kitchen_appliance_using", "kitchen_appliance_control_panel", "kitchen_appliance_size_context", "kitchen_appliance_results"],
        "electronics_gadgets": ["electronics_using_device", "electronics_hands_holding", "electronics_feature_highlight", "electronics_lifestyle_context"],
        "kids": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
        "other": ["front_full", "three_quarter_full", "back_full", "detail_logo"]
    }
}

# =============================================================================
# RECIPE-CATEGORY MAPPING
# =============================================================================

# Define which recipes are appropriate for each non-garment category
NON_GARMENT_RECIPE_CATEGORIES = {
    "health_beauty": [
        "studio-clean", "studio-glow-clarity", "vanity-lifestyle", "macro-texture-focus",
        "studio-color-pop", "editorial-highkey", "studio-porcelain-highkey"
    ],
    "kitchen_home_appliances": [
        "studio-clean", "home-countertop-daylight", "studio-appliance-focus", "result-lifestyle",
        "cafe-lifestyle", "home-minimal", "loft-natural"
    ],
    "electronics_gadgets": [
        "studio-clean", "studio-tech-reflect", "workspace-natural", "feature-highlight-macro",
        "studio-color-pop", "editorial-highkey", "night-boulevard"
    ],
    "kids": [
        "studio-clean", "playroom-daylight", "safety-demo-studio", "learning-lifestyle",
        "garden-daylight", "home-minimal", "loft-natural"
    ],
    "other": [
        "studio-clean", "studio-neutral", "desk-flatlay", "industrial-contrast",
        "street-style", "editorial-lowkey", "urban-cement-overcast"
    ]
}

def get_recipes_for_category(category: str) -> List[str]:
    """
    Get appropriate recipes for a specific non-garment product category
    
    Args:
        category: The product category (e.g., 'health_beauty', 'electronics_gadgets')
        
    Returns:
        List of recipe names appropriate for the category
    """
    return NON_GARMENT_RECIPE_CATEGORIES.get(category, NON_GARMENT_RECIPE_CATEGORIES["other"])

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_pose_rule(pose_label: str) -> str:
    """Get the rule description for a pose."""
    pose_atom = POSE_ATOMS.get(pose_label, {})
    return pose_atom.get("rules", "Neutral, natural posture.")

def get_pose_negatives(pose_label: str) -> str:
    """Get the negative prompts for a pose."""
    pose_atom = POSE_ATOMS.get(pose_label, {})
    return pose_atom.get("negatives", "")

def get_pose_directives(pose_label: str) -> Dict[str, Any]:
    """Get detailed directives for a pose."""
    pose_atom = POSE_ATOMS.get(pose_label, {})
    return pose_atom.get("directives", {})

def get_pose_contrast_policy(pose_label: str) -> Dict[str, Any]:
    """Get contrast policy for a pose."""
    return POSE_CONTRAST_POLICIES.get(pose_label, {})

def get_detail_crop_policy(pose_label: str) -> Dict[str, Any]:
    """Get crop policy for detail poses."""
    if pose_label in DETAIL_CROP_POLICIES:
        return DETAIL_CROP_POLICIES[pose_label]
    elif pose_label.startswith("detail_"):
        return DETAIL_CROP_POLICIES["default"]
    return {}

def select_poses(recipe: str, garment_type: str) -> List[str]:
    """
    Select 4 poses from the RECIPE_POSE_SETS based on (recipe, garment_type).
    Return a list of 4 pose labels.
    """
    if recipe not in RECIPE_POSE_SETS:
        raise ValueError(f"Invalid recipe: {recipe}")

    if garment_type not in RECIPE_POSE_SETS[recipe]:
        raise ValueError(f"Invalid garment_type {garment_type} for recipe {recipe}")

    return RECIPE_POSE_SETS[recipe][garment_type]

def get_recipe_style(recipe: str) -> Dict[str, Any]:
    """Get the style definition for a recipe."""
    if recipe not in RECIPE_STYLES:
        raise ValueError(f"Invalid recipe: {recipe}")
    return RECIPE_STYLES[recipe]

def get_appearance_profile(appearance_key: str) -> Dict[str, Any]:
    """Get appearance profile by key."""
    if appearance_key not in APPEARANCES:
        raise ValueError(f"Invalid appearance_key: {appearance_key}")
    return APPEARANCES[appearance_key]

def get_body_type_profile(body_type_key: str) -> Dict[str, Any]:
    """Get body type profile by key."""
    if body_type_key not in BODY_TYPES:
        raise ValueError(f"Invalid body_type_key: {body_type_key}")
    return BODY_TYPES[body_type_key]

def select_non_fashion_poses(recipe: str, product_category: str) -> List[str]:
    """
    Select 4 poses from the NON_FASHION_RECIPE_POSE_SETS based on (recipe, product_category).
    Return a list of 4 pose labels.
    """
    if recipe not in NON_FASHION_RECIPE_POSE_SETS:
        raise ValueError(f"Invalid recipe: {recipe}")

    if product_category not in NON_FASHION_RECIPE_POSE_SETS[recipe]:
        raise ValueError(f"Invalid product_category {product_category} for recipe {recipe}")

    return NON_FASHION_RECIPE_POSE_SETS[recipe][product_category]

def get_non_fashion_product_categories() -> Dict[str, Dict[str, Any]]:
    """Get all non-fashion product categories"""
    return NON_FASHION_PRODUCT_CATEGORIES

def get_non_fashion_quality_requirements(product_category: str) -> Dict[str, Any]:
    """
    Get quality requirements specific to non-fashion product categories
    
    Args:
        product_category: The product category (e.g., 'electronics_gadgets', 'health_beauty')
        
    Returns:
        Dict containing quality requirements for the product category
    """
    quality_requirements = {
        "electronics_gadgets": {
            "focus_areas": ["screen_clarity", "button_definition", "port_accessibility", "brand_logo"],
            "lighting_preferences": ["even_illumination", "no_harsh_reflections", "soft_shadows"],
            "detail_priorities": ["detail_logo", "detail_function"],
            "material_emphasis": ["surface_finish", "button_texture", "port_definition"]
        },
        "health_beauty": {
            "focus_areas": ["product_texture", "label_readability", "container_shape", "brand_prominence"],
            "lighting_preferences": ["soft_even_light", "no_harsh_shadows", "color_accuracy"],
            "detail_priorities": ["detail_logo", "detail_materials"],
            "material_emphasis": ["container_finish", "label_quality", "texture_definition"]
        },
        "kitchen_home_appliances": {
            "focus_areas": ["control_panel", "surface_finish", "branding", "functional_details"],
            "lighting_preferences": ["even_distribution", "no_glare", "natural_shadows"],
            "detail_priorities": ["detail_materials", "detail_function"],
            "material_emphasis": ["surface_texture", "control_definition", "finish_quality"]
        },
        "kids": {
            "focus_areas": ["safety_features", "age_appropriateness", "child_engagement", "durability"],
            "lighting_preferences": ["bright_cheerful_lighting", "soft_shadows", "child_friendly_atmosphere"],
            "detail_priorities": ["detail_safety", "detail_educational"],
            "material_emphasis": ["safe_materials", "child_friendly_textures", "bright_colors", "educational_elements"]
        },
        "other": {
            "focus_areas": ["product_definition", "brand_visibility", "material_quality", "functional_features"],
            "lighting_preferences": ["balanced_illumination", "no_harsh_shadows", "color_fidelity"],
            "detail_priorities": ["detail_logo", "detail_materials"],
            "material_emphasis": ["surface_finish", "texture_definition", "brand_clarity"]
        }
    }
    
    return quality_requirements.get(product_category, quality_requirements["other"])

def get_non_fashion_pose_adaptations(product_category: str) -> Dict[str, Any]:
    """
    Get pose adaptations specific to non-fashion product categories
    
    Args:
        product_category: The product category
        
    Returns:
        Dict containing pose adaptations for the product category
    """
    pose_adaptations = {
        "electronics_gadgets": {
            "preferred_angles": ["front_full", "three_quarter_full", "detail_logo", "detail_function"],
            "avoid_poses": ["hands_pockets_full", "walking_poses"],
            "product_interaction": "minimal_hand_contact",
            "focus_areas": ["screen_visibility", "button_accessibility"]
        },
        "health_beauty": {
            "preferred_angles": ["front_full", "hand_on_hip_three_quarter", "detail_logo", "detail_materials"],
            "avoid_poses": ["walking_poses", "dynamic_movement"],
            "product_interaction": "gentle_handling",
            "focus_areas": ["label_readability", "container_aesthetics"]
        },
        "kitchen_home_appliances": {
            "preferred_angles": ["front_full", "side_full", "detail_materials", "detail_function"],
            "avoid_poses": ["dynamic_movement", "casual_positions"],
            "product_interaction": "functional_demonstration",
            "focus_areas": ["control_accessibility", "surface_quality"]
        },
        "kids": {
            "preferred_angles": ["kids_play_interaction", "kids_safety_demonstration", "kids_educational_use", "kids_size_scale"],
            "avoid_poses": ["adult_only_contexts", "unsafe_positions"],
            "product_interaction": "child_engagement",
            "focus_areas": ["safety_features", "age_appropriateness", "educational_value"]
        },
        "other": {
            "preferred_angles": ["front_full", "three_quarter_full", "detail_logo", "detail_materials"],
            "avoid_poses": ["excessive_movement"],
            "product_interaction": "neutral_presentation",
            "focus_areas": ["product_definition", "brand_visibility"]
        }
    }
    
    return pose_adaptations.get(product_category, pose_adaptations["other"])

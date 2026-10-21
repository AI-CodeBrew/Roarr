"""Unit tests for Amour templated image prompts."""

from __future__ import annotations

import re
import unittest

from app.modules.generate.store.templates.packs.amour.image_prompts import (
    AMOUR_IMAGE_RATIOS,
    TEMPLATES,
    AmourImageVariables,
    build_all_prompts,
    category_defaults_for,
    fallback_image_variables,
)

PLACEHOLDER_RE = re.compile(r"\{[a-zA-Z_][a-zA-Z0-9_]*\}")

EXPECTED_KEYS = [
    "banner_image",
    "banner_image_2",
    "product_image_1",
    "product_image_2",
    "product_image_3",
    "look_image_1",
    "look_image_2",
    "look_image_3",
    "split_image",
    "editorial_image_1",
    "editorial_image_2",
    "story_image",
]

SAMPLE_VARS = {
    "beauty": AmourImageVariables(
        product="a rose-gold glass dropper serum bottle",
        category="beauty/skincare",
        props="rose petals, soft towel, ceramic dish",
        interaction="applying",
        setting="elegant bathroom vanity",
        palette="deep wine and soft gold tones",
        mood="warm editorial",
        person="a diverse young adult woman",
    ),
    "furniture": AmourImageVariables(
        product="an oak mid-century armchair with ivory boucle",
        category="furniture/home",
        props="linen throw, ceramic vase, stacked books",
        interaction="sitting on or relaxing with",
        setting="modern living room",
        palette="warm oak and ivory tones",
        mood="calm refined",
        person="a diverse adult relaxing at home",
    ),
    "electronics": AmourImageVariables(
        product="matte black wireless earbuds with a compact case",
        category="electronics",
        props="charging cable, soft cloth, desk plant",
        interaction="using",
        setting="clean desk setup",
        palette="soft neutral tones",
        mood="sleek modern",
        person="a diverse young professional",
    ),
}


class AmourImagePromptsTest(unittest.TestCase):
    def test_twelve_templates_and_ratios(self):
        self.assertEqual(len(TEMPLATES), 12)
        self.assertEqual([row["key"] for row in TEMPLATES], EXPECTED_KEYS)
        self.assertEqual(AMOUR_IMAGE_RATIOS["banner_image"], "16:9")
        self.assertEqual(AMOUR_IMAGE_RATIOS["product_image_1"], "3:4")
        self.assertEqual(AMOUR_IMAGE_RATIOS["split_image"], "1:1")
        self.assertEqual(AMOUR_IMAGE_RATIOS["story_image"], "4:5")

    def test_build_all_prompts_for_three_categories(self):
        for label, variables in SAMPLE_VARS.items():
            with self.subTest(category=label):
                slots = build_all_prompts(variables)
                self.assertEqual(len(slots), 12)
                self.assertEqual([s["key"] for s in slots], EXPECTED_KEYS)
                for spec in slots:
                    self.assertEqual(spec["ratio"], AMOUR_IMAGE_RATIOS[spec["key"]])
                    self.assertTrue(spec["prompt"])
                    self.assertIn("STYLE:", spec["prompt"])
                    self.assertIn("Avoid:", spec["prompt"])
                    self.assertTrue(spec["negativePrompt"])
                    leftovers = PLACEHOLDER_RE.findall(spec["prompt"])
                    self.assertEqual(
                        leftovers,
                        [],
                        f"{label}/{spec['key']} has unreplaced placeholders: {leftovers}",
                    )

    def test_unreplaced_placeholder_raises(self):
        broken = SAMPLE_VARS["beauty"].model_copy(update={"product": ""})
        with self.assertRaises(ValueError):
            build_all_prompts(broken)

    def test_category_defaults_and_fallback(self):
        beauty = category_defaults_for("health_beauty")
        self.assertEqual(beauty["interaction"], "applying")
        self.assertIn("dark", beauty["mood"])
        self.assertIn("wine", beauty["palette"])

        kids = category_defaults_for("kids_toys")
        self.assertEqual(kids["interaction"], "playing with")
        self.assertIn("bright", kids["mood"])
        self.assertNotIn("wine", kids["palette"].lower())

        fashion = category_defaults_for("fashion")
        self.assertIn("bright", fashion["mood"])

        furniture = category_defaults_for("furniture/home")
        self.assertIn("living room", furniture["setting"])
        electronics = category_defaults_for("electronics")
        self.assertEqual(electronics["interaction"], "using")

        vars_ = fallback_image_variables(
            "Test Serum",
            category="health_beauty",
            brand_colors=["#4A0E1F"],
        )
        slots = build_all_prompts(vars_)
        self.assertEqual(len(slots), 12)
        self.assertIn("#4A0E1F", vars_.palette)

        kids_vars = fallback_image_variables("Toy Car", category="kids_toys")
        self.assertIn("bright", kids_vars.mood)
        self.assertIn("never dark", kids_vars.palette)


if __name__ == "__main__":
    unittest.main()

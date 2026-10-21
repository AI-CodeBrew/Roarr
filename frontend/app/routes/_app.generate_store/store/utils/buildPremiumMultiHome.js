/**
 * Collective (Sleek) and Meridian (Vibe) homepages.
 * Product 1 is the product already on that theme's product page.
 * Two more products in the same category fill the other homepage slots.
 * Homepage files are not the product-page gallery.
 */
import { getHomeDataForPreview } from "./default-magic-responses/home-data.js";

const PRODUCTS = {
  collective: {
    fashion: [
      ["Royal Blue Crystal Silver Plated Bracelet", "Brilliant royal blue stones on silver plating."],
      ["Pearl Drop Earrings", "A pair of pearl drops on silver hooks."],
      ["Gold Chain Necklace", "A fine gold chain for everyday wear."],
    ],
    kids_toys: [
      ["Wooden Abacus & Ramp Set", "Colorful math and vehicle play in child-safe wood."],
      ["Wooden Shape Sorter", "Colorful wooden shapes for a first puzzle."],
      ["Pull-Along Wooden Dog", "A small wooden dog on wheels."],
    ],
    general: [
      ["Stanley Quencher H2.0", "Double-wall insulation that keeps a drink cold."],
      ["Insulated Travel Mug", "A lidded mug that keeps coffee hot."],
      ["Stainless Water Bottle", "A slim bottle for the day."],
    ],
    health_beauty: [
      ["Essence Matte Liquid Lipstick", "A long-wearing matte lipstick with rich color."],
      ["Soft Matte Blush Stick", "A cream blush in a slim stick."],
      ["Clear Brow Gel", "A clear gel that holds brows in place."],
    ],
    home_kitchen: [
      ["Marble Designed Chef Knife", "A chef knife with a marble-patterned handle."],
      ["Walnut Serving Board", "A long board for bread and cheese."],
      ["Olivewood Spoon Set", "Three spoons for stirring and serving."],
    ],
    car_accessories: [
      ["Premium Car Drying Towel", "An absorbent microfiber towel for a spotless dry."],
      ["Microfiber Wash Mitt", "A soft mitt for a gentle wash."],
      ["Interior Detail Brush", "A small brush for vents and seams."],
    ],
  },
  meridian: {
    fashion: [
      ["Bohemian Elegance Sapphire Gold Hoops", "Sapphire drops on gold hoops."],
      ["Gold Cuff Bracelet", "An open gold cuff with a smooth finish."],
      ["Layered Coin Necklace", "A short gold necklace with small coins."],
    ],
    kids_toys: [
      ["Cuddle Dino Plush Friend", "A soft dinosaur buddy for naps and play."],
      ["Cloud Bunny Plush", "A soft bunny for bedtime."],
      ["Knit Bear Rattle", "A small knitted bear with a gentle rattle."],
    ],
    general: [
      ["Pulse Portable Bluetooth Speaker", "Compact sound that travels from desk to park."],
      ["Compact Wireless Earbuds", "Small earbuds with a pocket case."],
      ["Desk Cable Organizer", "A short tray that hides charging cables."],
    ],
    health_beauty: [
      ["Velvet Berry Matte Lipstick", "A deep berry matte lipstick."],
      ["Rosewater Face Mist", "A light mist for a fresh face."],
      ["Silk Sleep Mask", "A soft mask for darker mornings."],
    ],
    home_kitchen: [
      ["Stoneware Pour-Over Mug Set", "A ceramic mug set for brewing and sipping."],
      ["Speckled Cereal Bowls", "A pair of stoneware bowls."],
      ["Linen Tea Towels", "Two linen towels for the kitchen."],
    ],
    car_accessories: [
      ["Magnetic Car Phone Mount", "A matte black mount that holds a phone steady."],
      ["Seat Gap Organizer", "A slim pocket for the seat gap."],
      ["Sun Visor Tissue Holder", "A small holder that clips to the visor."],
    ],
  },
};

/** Filled after image generation. */
const HOME_IMAGES = {
  collective: {
    fashion: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0e3a9a4f_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/220235b1_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/62a26640_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/44016c38_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b158874e_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/193e9a67_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a9e2b431_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/85adba35_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/82b01304_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/018f024d_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5b28b093_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a52b3756_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9770e6f9_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0ff43e19_zambeel_ai_generated_image.png",
    },
    kids_toys: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/92186739_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e34a6cd0_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/53566aed_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ed91b9da_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/737bd35a_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4e559fda_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f9ede467_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8435e1d4_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1e5a7c2e_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5ef9fad2_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/692a4a6f_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2a9a1683_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a474e85c_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9b351990_zambeel_ai_generated_image.png",
    },
    general: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2ae02851_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3be6ab77_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b738a1dd_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a00ac520_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/19e559fd_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6a1a54cc_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ffd39df8_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/da4faef3_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7be147fd_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/005aeba4_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9acad57a_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/73bda036_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b75230fb_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e7dd1837_zambeel_ai_generated_image.png",
    },
    health_beauty: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a4072fe5_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7848d9ba_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e3ce2211_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c6afd7b_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cf89b31e_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4ea27026_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ec9e6283_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/408ab4b7_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/416ca909_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a87ba9bc_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e2d1de83_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/82391e8f_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5e364982_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/879181e0_zambeel_ai_generated_image.png",
    },
    home_kitchen: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cb66752e_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e0b444c9_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ba601f52_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/73f8596a_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/95e4f4bc_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e4d37627_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/83f5c5f1_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52e9d764_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/362db680_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f3d648a6_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/058aec87_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c84a5e6f_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c95cd51_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/03627316_zambeel_ai_generated_image.png",
    },
    car_accessories: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1731c855_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/117672e8_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5a16ea09_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8a0eef8b_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2a8aaa49_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2d340139_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/21e58646_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/312876b5_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/94ae208c_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d055888d_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0317e785_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/df617865_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d015c305_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0b3cf3ae_zambeel_ai_generated_image.png",
    },
  },
  meridian: {
    fashion: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a1a3bcdb_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/68f94ee3_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c173ff90_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9e130b74_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/525d55a4_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/909a7779_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0fbab7cb_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1517907c_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d7086fb3_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/94423f11_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8fed081b_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4660ea9c_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/42d76de2_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4bf33445_zambeel_ai_generated_image.png",
    },
    kids_toys: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6f2e3b34_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e60b8d37_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/8f6cb2af_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1bcda3df_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/52ae9c4a_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4bca92fd_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/41f269ff_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4cd93698_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/334fcbc7_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7a8d7ac5_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/771308d1_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ae21b8ba_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/010ae905_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/510ce9de_zambeel_ai_generated_image.png",
    },
    general: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1a5b8883_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/bab6282d_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/118039c8_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ba9a3131_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fdc8bdf0_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b94241c8_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3532a4ae_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/cdcf48a0_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d4a49a52_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0313c999_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f1d8d50a_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/79075f80_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/54c513d7_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ae5f8789_zambeel_ai_generated_image.png",
    },
    health_beauty: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/83a6d276_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7ccfcb04_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d90d964f_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f64ce782_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/27f78771_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/125814a3_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a57d10ec_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6ec2ebe7_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/10c82b87_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ec34cbe5_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7a1b2ba2_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b17ffa26_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b1a59c7b_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0266d0c4_zambeel_ai_generated_image.png",
    },
    home_kitchen: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/099d6a76_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/fac965bf_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4b6472ed_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0da24f71_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6c7acba8_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0fdbd23e_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/11b7aaea_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c1cbb97_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/3b95e661_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0741a8d6_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/aa16e549_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c44831ba_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7d79687b_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5a07d54a_zambeel_ai_generated_image.png",
    },
    car_accessories: {
      product_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e680186b_zambeel_ai_generated_image.png",
      banner_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/2e2baa26_zambeel_ai_generated_image.jpg",
      feature_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/845dc25b_zambeel_ai_generated_image.png",
      product_impact_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ce8eb667_zambeel_ai_generated_image.png",
      highlight_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0ab05498_zambeel_ai_generated_image.png",
      star_image: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4365bd69_zambeel_ai_generated_image.png",
      product_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ecc167bd_zambeel_ai_generated_image.png",
      banner_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0aa95456_zambeel_ai_generated_image.jpg",
      feature_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/1146c406_zambeel_ai_generated_image.png",
      product_impact_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/189d468d_zambeel_ai_generated_image.png",
      product_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e3034122_zambeel_ai_generated_image.png",
      banner_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c96a4e14_zambeel_ai_generated_image.jpg",
      feature_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/c1a52c97_zambeel_ai_generated_image.png",
      product_impact_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/845142b8_zambeel_ai_generated_image.png",
    },
  },
};
const GRID_IMAGES = {
  collective: {
    fashion: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4849e021_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/0af0b867_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/75186dc0_zambeel_ai_generated_image.png",
    },
    kids_toys: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/98f30f20_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/30b6c54a_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ce75475a_zambeel_ai_generated_image.png",
    },
    general: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/7c95bdeb_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b9b0c93e_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/9149b7cb_zambeel_ai_generated_image.png",
    },
    health_beauty: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/48c42d8f_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/04d281f0_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b8998d3e_zambeel_ai_generated_image.png",
    },
    home_kitchen: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b283548a_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/5522e15e_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/472d0dbd_zambeel_ai_generated_image.png",
    },
    car_accessories: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/22671163_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f641706f_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/535a17e2_zambeel_ai_generated_image.png",
    },
  },
  meridian: {
    fashion: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/bd72d12a_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e6ab733b_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/ca5e50be_zambeel_ai_generated_image.png",
    },
    kids_toys: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e4b12be8_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/407b2c05_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/426f870a_zambeel_ai_generated_image.png",
    },
    general: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/b70abd1d_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/bced14b7_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/886ccf4d_zambeel_ai_generated_image.png",
    },
    health_beauty: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4a771cb4_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/49fb610e_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/6e9bc094_zambeel_ai_generated_image.png",
    },
    home_kitchen: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/962e9b9c_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/a3839820_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/d9d586a9_zambeel_ai_generated_image.png",
    },
    car_accessories: {
      grid_image_1: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/4a988844_zambeel_ai_generated_image.png",
      grid_image_2: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/f57c42ad_zambeel_ai_generated_image.png",
      grid_image_3: "https://product-images-zambeel.s3.eu-west-3.amazonaws.com/e3099709_zambeel_ai_generated_image.png",
    },
  },
};

function categoryKey(category) {
  return String(category || "general")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function themeKey(template) {
  return Number(template) === 2 ? "meridian" : "collective";
}

function productsFor(theme, category) {
  const catalog = PRODUCTS[theme] || PRODUCTS.collective;
  return catalog[categoryKey(category)] || catalog.general;
}

export function buildPremiumMultiHomeData(category = "general", template = 1) {
  const theme = themeKey(template);
  const key = categoryKey(category);
  const shots = HOME_IMAGES[theme]?.[key];
  const products = productsFor(theme, key);
  if (!shots?.banner_image_1 || !products) return null;

  const base = getHomeDataForPreview("multi", key, "classic") || {};
  const text = { ...(base.text || {}) };

  products.forEach(([title, line], index) => {
    const n = index + 1;
    text[`banner_heading_${n}`] = title;
    text[`banner_eyebrow_${n}`] = line;
    text[`featured_product_headline_${n}`] = title;
    text[`featured_product_subheadline_${n}`] = line;
    text[`top_product_punchline_${n}`] = title;
    text[`top_product_punchline_${n}_description`] = line;
  });

  text.highlight_banner_section_heading = products[0][0];
  text.highlight_banner_section_subheading = products[0][1];
  text.highlight_banner_section_description = products[0][1];
  text.marquee_text_1 = products[0][0];
  text.marquee_text_2 = products[1][0];
  text.marquee_text_3 = products[2][0];
  text.punchy_poetic_headline = `${products[0][0]} ${products[1][0]} ${products[2][0]}`;
  products.forEach(([title, line], index) => {
    const n = index + 1;
    text[`star_product_feature_${n}`] = title;
    text[`star_product_feature_${n}_desc`] = line;
    text[`faq_question_${n}`] = `What is the ${title}?`;
    text[`faq_answer_${n}`] = line;
  });
  text.star_product_feature_4 = products[0][0];
  text.star_product_feature_4_desc = products[0][1];

  return {
    text,
    images: {
      ...(base.images || {}),
      ...shots,
      product_base_image_2: shots.highlight_image,
    },
  };
}

/** Three demo products for the homepage product grid. */
export function buildPremiumMultiGridProducts(category = "general", template = 1) {
  const theme = themeKey(template);
  const key = categoryKey(category);
  const shots = GRID_IMAGES[theme]?.[key];
  const products = productsFor(theme, key);
  if (!shots?.grid_image_1 || !products) return null;
  return products
    .map(([title, line], index) => {
      const url = shots[`grid_image_${index + 1}`];
      if (!url) return null;
      const handle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return {
        id: `${theme}-grid-${key}-${index + 1}`,
        title,
        handle,
        description: line,
        featuredImage: { url, altText: title },
        images: { edges: [{ node: { url, altText: title } }] },
        variants: {
          edges: [{ node: { id: `${theme}-grid-variant-${key}-${index + 1}`, price: "29.00" } }],
        },
      };
    })
    .filter(Boolean);
}

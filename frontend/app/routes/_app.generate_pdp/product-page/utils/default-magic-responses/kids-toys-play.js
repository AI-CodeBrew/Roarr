/**
 * kids_toys — Play template demo (template 3).
 * Sleek and Vibe keep their own files. Play is shown only for Kids Toys.
 */
import { KIDS_TOYS_DEFAULT_MAGIC_RESPONSES } from "./kids-toys.js";
import { KIDS_TOYS_VIBE_DEFAULT_MAGIC_RESPONSES } from "./kids-toys-vibe.js";

const jeepImages = {
  product_image_1: "",
  product_image_2: "",
  product_image_3: "",
  product_image_4: "",
  product_image_5: "",
};

export const KIDS_TOYS_PLAY_DEFAULT_MAGIC_RESPONSES = {
  ...KIDS_TOYS_VIBE_DEFAULT_MAGIC_RESPONSES,
  text: {
    ...KIDS_TOYS_VIBE_DEFAULT_MAGIC_RESPONSES.text,
    product_title: "Red Ride-On Jeep",
    product_subtitle: "A battery jeep with real lights, chunky tires, and a seat made for little drivers.",
    badge_text_1: "Kid Safe",
    badge_text_2: "Free Shipping",
    badge_text_3: "90 Days Returns",
    badge_text_4: "Gift Favorite",
    marquee_text_1: "Sale 50% Off",
    marquee_text_2: "Real Headlights",
    marquee_text_3: "Parent Remote",
    feature_label_1: "Real headlights",
    feature_label_2: "Parent remote",
    feature_label_3: "Chunky tires",
    pillow_banner_heading: "Half off the red jeep they ask for.",
    pillow_banner_subheading: "Use the code at checkout. It stacks with the sale price.",
    promo_code: "JEEPKIDS",
    pill_1: "Ages 3+",
    pill_2: "Free shipping",
    pill_3: "90 day returns",
    circle_1: "Open-air seat",
    circle_2: "Working lights",
    circle_3: "Big tread tires",
    circle_4: "Easy to steer",
    product_question_1: "Description",
    product_question_1_answer: "A red ride-on jeep with lights, a soft seat, and tires built for driveway play.",
    product_question_2: "Details",
    product_question_2_answer: "Battery power, a parent remote, and a body sized for one little driver.",
    product_question_3: "Shipping",
    product_question_3_answer: "Free shipping. 90-day returns on unused jeeps in the original box.",
    review_title_1: "Enter Your Text",
    review_body_1: "Enter customer review over here",
    review_name_1: "Reviewer Name",
    review_title_2: "Enter Your Text",
    review_body_2: "Enter customer review over here",
    review_name_2: "Reviewer Name",
    review_title_3: "Enter Your Text",
    review_body_3: "Enter customer review over here",
    review_name_3: "Reviewer Name",
    review_title_4: "Enter Your Text",
    review_body_4: "Enter customer review over here",
    review_name_4: "Reviewer Name",
  },
  images: {
    ...KIDS_TOYS_DEFAULT_MAGIC_RESPONSES.images,
    product_images: jeepImages,
    body_images: {
      ...KIDS_TOYS_DEFAULT_MAGIC_RESPONSES.images.body_images,
      feature_image: "",
      problem_solving_image: "",
      product_highlight_1: "",
      product_highlight_2: "",
      product_highlight_3: "",
      product_highlight_4: "",
      happy_customer_image_1: "",
      happy_customer_image_2: "",
      happy_customer_image_3: "",
    },
  },
  color: "#6F2424",
};

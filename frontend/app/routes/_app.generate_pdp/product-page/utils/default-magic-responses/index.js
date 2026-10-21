/**
 * Default Magic Responses Index
 * Exports all category-specific default magic responses
 */

import { FASHION_DEFAULT_MAGIC_RESPONSES } from './fashion.js';
import { FASHION_VIBE_DEFAULT_MAGIC_RESPONSES } from './fashion-vibe.js';
import {
    HEALTH_BEAUTY_DEFAULT_MAGIC_RESPONSES,
    HEALTH_BEAUTY_GLOW_DEFAULT_MAGIC_RESPONSES,
} from './health-beauty.js';
import { HEALTH_BEAUTY_VIBE_DEFAULT_MAGIC_RESPONSES } from './health-beauty-vibe.js';
import { CAR_ACCESSORIES_DEFAULT_MAGIC_RESPONSES } from './car-accessories.js';
import { CAR_ACCESSORIES_VIBE_DEFAULT_MAGIC_RESPONSES } from './car-accessories-vibe.js';
import { HOME_KITCHEN_DEFAULT_MAGIC_RESPONSES } from './home-kitchen.js';
import { HOME_KITCHEN_VIBE_DEFAULT_MAGIC_RESPONSES } from './home-kitchen-vibe.js';
import { KIDS_TOYS_DEFAULT_MAGIC_RESPONSES } from './kids-toys.js';
import { KIDS_TOYS_VIBE_DEFAULT_MAGIC_RESPONSES } from './kids-toys-vibe.js';
import { GENERAL_DEFAULT_MAGIC_RESPONSES } from './general.js';
import { GENERAL_VIBE_DEFAULT_MAGIC_RESPONSES } from './general-vibe.js';

/**
 * Map of category names to their default magic responses
 */
export const DEFAULT_MAGIC_RESPONSES_BY_CATEGORY = {
    'fashion': FASHION_DEFAULT_MAGIC_RESPONSES,
    'health_beauty': HEALTH_BEAUTY_DEFAULT_MAGIC_RESPONSES,
    'car_accessories': CAR_ACCESSORIES_DEFAULT_MAGIC_RESPONSES,
    'home_kitchen': HOME_KITCHEN_DEFAULT_MAGIC_RESPONSES,
    'kids_toys': KIDS_TOYS_DEFAULT_MAGIC_RESPONSES,
    'general': GENERAL_DEFAULT_MAGIC_RESPONSES
};

/** Vibe (template 2) product overrides — Sleek keeps DEFAULT_MAGIC_RESPONSES_BY_CATEGORY. */
export const VIBE_MAGIC_RESPONSES_BY_CATEGORY = {
    fashion: FASHION_VIBE_DEFAULT_MAGIC_RESPONSES,
    health_beauty: HEALTH_BEAUTY_VIBE_DEFAULT_MAGIC_RESPONSES,
    home_kitchen: HOME_KITCHEN_VIBE_DEFAULT_MAGIC_RESPONSES,
    kids_toys: KIDS_TOYS_VIBE_DEFAULT_MAGIC_RESPONSES,
    car_accessories: CAR_ACCESSORIES_VIBE_DEFAULT_MAGIC_RESPONSES,
    general: GENERAL_VIBE_DEFAULT_MAGIC_RESPONSES,
};

/**
 * Get default magic responses for a specific category.
 * @param {string} category - The category name
 * @param {{ template?: number|null }} [options] - Pass template: 2 for Vibe-specific demos
 * @returns {Object} Default magic responses for the category (with text, images, color)
 */
export function getDefaultMagicResponses(category, options = {}) {
    const cat = String(category || "general")
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("-", "_");
    const template = Number(options?.template);
    // Template 3 = Aura for all categories (Play demos retired in v2).
    if (template === 3) {
        return HEALTH_BEAUTY_GLOW_DEFAULT_MAGIC_RESPONSES;
    }
    if (template === 2 && VIBE_MAGIC_RESPONSES_BY_CATEGORY[cat]) {
        return VIBE_MAGIC_RESPONSES_BY_CATEGORY[cat];
    }
    return DEFAULT_MAGIC_RESPONSES_BY_CATEGORY[cat] || GENERAL_DEFAULT_MAGIC_RESPONSES;
}

/**
 * Get text defaults for a specific category
 * @param {string} category - The category name
 * @returns {Object} Text defaults for the category
 */
export function getTextDefaults(category) {
    const categoryDefaults = getDefaultMagicResponses(category);
    return categoryDefaults.text || {};
}

/**
 * Get image defaults for a specific category
 * @param {string} category - The category name
 * @returns {Object} Image defaults for the category (with body_images and product_images)
 */
export function getImageDefaults(category, options = {}) {
    const categoryDefaults = getDefaultMagicResponses(category, options);
    return categoryDefaults.images || {};
}

/**
 * Get body images for a specific category
 * @param {string} category - The category name
 * @returns {Object} Body image defaults for the category
 */
export function getBodyImages(category) {
    const imageDefaults = getImageDefaults(category);
    return imageDefaults.body_images || {};
}

/**
 * Get product images for a specific category
 * @param {string} category - The category name
 * @returns {Object} Product image defaults for the category
 */
export function getProductImages(category, options = {}) {
    const imageDefaults = getImageDefaults(category, options);
    return imageDefaults.product_images || {};
}

/**
 * Get the single default color (hex) for a category.
 * Default magic responses use one hex: color: '#xxxxxx'.
 * @param {string} category - The category name
 * @returns {string|null} Single hex color or null
 */
export function getDefaultColor(category, options = {}) {
    const categoryDefaults = getDefaultMagicResponses(category, options);
    if (categoryDefaults.color && typeof categoryDefaults.color === 'string') return categoryDefaults.color;
    const schemes = categoryDefaults.color_schemes;
    if (Array.isArray(schemes) && schemes.length > 0) {
        const first = schemes[0];
        return typeof first === 'string' ? first : (first?.primary || null);
    }
    return null;
}

/**
 * Get color schemes for a specific category (array for backward compat).
 * When config has single "color", returns [color].
 * @param {string} category - The category name
 * @returns {Array} Color schemes for the category (array of hex strings)
 */
export function getColorSchemes(category) {
    const categoryDefaults = getDefaultMagicResponses(category);
    const single = getDefaultColor(category);
    if (single) return [single];
    const schemes = categoryDefaults.color_schemes || [];
    return Array.isArray(schemes) ? schemes.map(s => typeof s === 'string' ? s : s?.primary).filter(Boolean) : [];
}

/**
 * Get a specific default text value for a category and field
 * @param {string} category - The category name
 * @param {string} field - The field name
 * @param {*} fallback - Fallback value if not found
 * @returns {*} The default value or fallback
 */
export function getDefaultTextValue(category, field, fallback = '') {
    const textDefaults = getTextDefaults(category);
    return textDefaults[field] !== undefined ? textDefaults[field] : fallback;
}

/**
 * Get a specific default image URL for a category and field
 * @param {string} category - The category name
 * @param {string} field - The field name (e.g., 'bento_cell_1_image' or 'product_image_1')
 * @param {string} imageType - The image type: 'body_images' or 'product_images' (default: 'body_images')
 * @param {*} fallback - Fallback value if not found
 * @returns {*} The default image URL or fallback
 */
export function getDefaultImageValue(category, field, imageType = 'body_images', fallback = null) {
    const imageDefaults = getImageDefaults(category);
    const images = imageDefaults[imageType] || {};
    return images[field] !== undefined ? images[field] : fallback;
}

/**
 * Get a specific body image URL for a category and field
 * @param {string} category - The category name
 * @param {string} field - The field name (e.g., 'bento_cell_1_image')
 * @param {*} fallback - Fallback value if not found
 * @returns {*} The default image URL or fallback
 */
export function getBodyImageValue(category, field, fallback = null) {
    const bodyImages = getBodyImages(category);
    return bodyImages[field] !== undefined ? bodyImages[field] : fallback;
}

/**
 * Get a specific product image URL for a category and field
 * @param {string} category - The category name
 * @param {string} field - The field name (e.g., 'product_image_1')
 * @param {*} fallback - Fallback value if not found
 * @returns {*} The default image URL or fallback
 */
export function getProductImageValue(category, field, fallback = null) {
    const productImages = getProductImages(category);
    return productImages[field] !== undefined ? productImages[field] : fallback;
}

/**
 * Get a specific color (hex) by index for a category
 * @param {string} category - The category name
 * @param {number} index - The color index (0-based)
 * @returns {string|null} The hex color or null
 */
export function getColorScheme(category, index = 0) {
    const schemes = getColorSchemes(category);
    return schemes[index] || null;
}

export {
    FASHION_DEFAULT_MAGIC_RESPONSES,
    HEALTH_BEAUTY_DEFAULT_MAGIC_RESPONSES,
    CAR_ACCESSORIES_DEFAULT_MAGIC_RESPONSES,
    HOME_KITCHEN_DEFAULT_MAGIC_RESPONSES,
    KIDS_TOYS_DEFAULT_MAGIC_RESPONSES,
    GENERAL_DEFAULT_MAGIC_RESPONSES
};

/**
 * Coupon codes configuration and validation
 */

// Define valid coupon codes with their discount details
export const COUPONS = {
  // Example coupon codes - you can add more here
  "WELCOME10": {
    code: "WELCOME10",
    discountPercent: 10,
    description: "10% off your first subscription",
    valid: true,
  },
  "SAVE20": {
    code: "SAVE20",
    discountPercent: 20,
    description: "20% off your subscription",
    valid: true,
  },
  "LAUNCH50": {
    code: "LAUNCH50",
    discountPercent: 50,
    description: "50% off launch special",
    valid: true,
  },
  "JANUARY50": {
    code: "JANUARY50",
    discountPercent: 50,
    description: "50% off Starter (Monthly)",
    valid: true,
  },
};


/**
 * Apply coupon discount to a price
 * @param {number} price - Original price
 * @param {object|null} coupon - Coupon object from validateCoupon
 * @returns {object} - Object with originalPrice, discountAmount, finalPrice, discountPercent
 */
export function applyCouponDiscount(price, coupon) {
  if (!coupon || !coupon.valid) {
    return {
      originalPrice: price,
      discountAmount: 0,
      finalPrice: price,
      discountPercent: 0,
    };
  }

  const discountPercent = coupon.discountPercent || 0;
  const discountAmount = (price * discountPercent) / 100;
  const finalPrice = Math.max(0, price - discountAmount);

  return {
    originalPrice: price,
    discountAmount,
    finalPrice,
    discountPercent,
  };
}


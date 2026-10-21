(function() {
  'use strict';

  function normOpt(x) {
    if (x == null || x === '') return '';
    return String(x);
  }

  function getVariantOption(variant, position) {
    if (position === 1) return normOpt(variant.option1);
    if (position === 2) return normOpt(variant.option2);
    if (position === 3) return normOpt(variant.option3);
    return '';
  }

  function findVariantByOptions(variants, o1, o2, o3) {
    var a = normOpt(o1);
    var b = normOpt(o2);
    var c = normOpt(o3);
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      if (normOpt(v.option1) === a && normOpt(v.option2) === b && normOpt(v.option3) === c) {
        return v;
      }
    }
    return null;
  }

  function getVariantsJson(container) {
    var script = container.querySelector('script[data-product-variants-json]');
    if (!script || !script.textContent) return null;
    try {
      return JSON.parse(script.textContent.trim());
    } catch (e) {
      return null;
    }
  }

  function resolveVariantForOptionClick(variants, position, value, container) {
    var o1 = '';
    var o2 = '';
    var o3 = '';
    for (var p = 1; p <= 3; p++) {
      var part = '';
      if (p === position) {
        part = value;
      } else {
        var selectedBtn = container.querySelector(
          '.tae-product-details-option-value-btn.is-selected[data-option-position="' + p + '"]'
        );
        part = selectedBtn ? selectedBtn.getAttribute('data-option-value') || '' : '';
      }
      if (p === 1) o1 = part;
      if (p === 2) o2 = part;
      if (p === 3) o3 = part;
    }
    var exact = findVariantByOptions(variants, o1, o2, o3);
    if (exact) return exact;
    var i;
    for (i = 0; i < variants.length; i++) {
      var cand = variants[i];
      if (cand.available && getVariantOption(cand, position) === normOpt(value)) {
        return cand;
      }
    }
    for (i = 0; i < variants.length; i++) {
      var c2 = variants[i];
      if (getVariantOption(c2, position) === normOpt(value)) {
        return c2;
      }
    }
    return null;
  }

  function syncOptionButtonsFromVariant(container, variant) {
    var groups = container.querySelectorAll('.tae-product-details-variant-group[data-option-position]');
    groups.forEach(function(group) {
      var pos = parseInt(group.getAttribute('data-option-position'), 10);
      if (!pos) return;
      var val = getVariantOption(variant, pos);
      var btns = group.querySelectorAll('.tae-product-details-option-value-btn');
      btns.forEach(function(btn) {
        var bv = btn.getAttribute('data-option-value') || '';
        btn.classList.toggle('is-selected', normOpt(bv) === normOpt(val));
      });
    });
  }

  function discountPercentFromVariant(v) {
    var cp = v.compare_at_price || 0;
    var pr = v.price || 0;
    if (cp > pr) return Math.round((cp - pr) * 100.0 / cp);
    return 0;
  }

  function applyVariantToProductDetails(container, variant) {
    if (!variant) return;

    var priceCurrent = container.querySelector('[data-price-current]');
    var priceCompare = container.querySelector('[data-price-compare]');
    var discountBadge = container.querySelector('[data-discount-badge]');
    var discountText = container.querySelector('[data-discount-text]');

    var variantPriceFormatted = variant.price_formatted || '';
    var variantComparePrice = parseInt(variant.compare_at_price, 10) || 0;
    var variantComparePriceFormatted = variant.compare_formatted || '';
    var variantPrice = parseInt(variant.price, 10) || 0;
    var variantDiscountPercentage = discountPercentFromVariant(variant);

    if (priceCurrent && variantPriceFormatted) {
      priceCurrent.textContent = variantPriceFormatted;
    }

    if (priceCompare) {
      if (variantComparePrice > variantPrice && variantComparePriceFormatted) {
        priceCompare.textContent = variantComparePriceFormatted;
        priceCompare.style.display = '';
      } else {
        priceCompare.style.display = 'none';
      }
    }

    if (discountBadge && discountText) {
      if (variantDiscountPercentage > 0) {
        discountText.textContent = variantDiscountPercentage + '% off';
        discountBadge.style.display = '';
      } else {
        discountBadge.style.display = 'none';
      }
    }

    var variantId = String(variant.id);
    updateProductFormVariant(variantId);
    updateUrlVariant(variantId);

    var buyNowButtons = document.querySelectorAll('.tae-buy-now-button-btn[data-variant-id]');
    buyNowButtons.forEach(function(buyNowButton) {
      buyNowButton.setAttribute('data-variant-id', variantId);
    });

    document.dispatchEvent(new CustomEvent('variantChanged', {
      detail: { variantId: variantId }
    }));
  }

  function handleOptionValueClick(button, container) {
    var variants = getVariantsJson(container);
    if (!variants || !variants.length) return;

    var position = parseInt(button.getAttribute('data-option-position'), 10);
    var value = button.getAttribute('data-option-value') || '';
    if (!position) return;

    var variant = resolveVariantForOptionClick(variants, position, value, container);
    if (!variant) return;

    syncOptionButtonsFromVariant(container, variant);
    applyVariantToProductDetails(container, variant);
  }

  /**
   * Update the Shopify product form's variant input so add-to-cart uses the correct variant
   */
  function updateProductFormVariant(variantId) {
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (!productForm) return;

    const variantSelect = productForm.querySelector('select[name="id"]');
    if (variantSelect) {
      variantSelect.value = variantId;
      variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const variantRadios = productForm.querySelectorAll('input[name="id"]');
    if (variantRadios.length) {
      variantRadios.forEach(function(radio) {
        radio.checked = radio.value === String(variantId);
      });
      const checked = productForm.querySelector('input[name="id"]:checked');
      if (checked) {
        checked.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    const variantInput = productForm.querySelector('input[name="id"]');
    if (variantInput) {
      variantInput.value = variantId;
      variantInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Update URL with variant parameter (for themes that use it)
   */
  function updateUrlVariant(variantId) {
    if (!variantId || typeof window.history === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variantId);
    window.history.replaceState({}, '', url.toString());
  }

  function handleVariantButtonClick(button, container) {
    if (button.classList.contains('tae-product-details-option-value-btn')) {
      handleOptionValueClick(button, container);
      return;
    }

    const variantButtons = container.querySelectorAll('.tae-product-details-variant-btn');
    const priceCurrent = container.querySelector('[data-price-current]');
    const priceCompare = container.querySelector('[data-price-compare]');
    const discountBadge = container.querySelector('[data-discount-badge]');
    const discountText = container.querySelector('[data-discount-text]');

    variantButtons.forEach(function(btn) {
      btn.classList.remove('is-selected');
    });

    button.classList.add('is-selected');

    const variantId = button.getAttribute('data-variant-id');
    const variantPriceFormatted = button.getAttribute('data-variant-price-formatted');
    const variantComparePriceFormatted = button.getAttribute('data-variant-compare-price-formatted');
    const variantDiscountPercentage = parseInt(button.getAttribute('data-variant-discount-percentage'), 10);
    const variantComparePrice = parseInt(button.getAttribute('data-variant-compare-price'), 10);
    const variantPrice = parseInt(button.getAttribute('data-variant-price'), 10);

    if (priceCurrent && variantPriceFormatted) {
      priceCurrent.textContent = variantPriceFormatted;
    }

    if (priceCompare) {
      if (variantComparePrice > variantPrice && variantComparePriceFormatted) {
        priceCompare.textContent = variantComparePriceFormatted;
        priceCompare.style.display = '';
      } else {
        priceCompare.style.display = 'none';
      }
    }

    if (discountBadge && discountText) {
      if (variantDiscountPercentage > 0) {
        discountText.textContent = variantDiscountPercentage + '% off';
        discountBadge.style.display = '';
      } else {
        discountBadge.style.display = 'none';
      }
    }

    updateProductFormVariant(variantId);
    updateUrlVariant(variantId);

    const buyNowButtons = document.querySelectorAll('.tae-buy-now-button-btn[data-variant-id]');
    buyNowButtons.forEach(function(buyNowButton) {
      buyNowButton.setAttribute('data-variant-id', variantId);
    });

    document.dispatchEvent(new CustomEvent('variantChanged', {
      detail: { variantId: variantId }
    }));
  }

  function initProductDetails() {
    // Use event delegation - works even when other scripts replace variant buttons
    document.addEventListener('click', function(e) {
      const button = e.target.closest('.tae-product-details-variant-btn');
      if (!button) return;
      const container = button.closest('.tae-product-details');
      if (!container) return;
      handleVariantButtonClick(button, container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductDetails);
  } else {
    initProductDetails();
  }
})();


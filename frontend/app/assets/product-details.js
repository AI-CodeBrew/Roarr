(function() {
  'use strict';

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
    const variantButtons = container.querySelectorAll('.tae-product-details-variant-btn');
    const priceCurrent = container.querySelector('[data-price-current]');
    const priceCompare = container.querySelector('[data-price-compare]');
    const discountBadge = container.querySelector('[data-discount-badge]');
    const discountText = container.querySelector('[data-discount-text]');

    // Remove selected class from all buttons in this container
    variantButtons.forEach(function(btn) {
      btn.classList.remove('is-selected');
    });

    // Add selected class to clicked button
    button.classList.add('is-selected');

    const variantId = button.getAttribute('data-variant-id');
    const variantPriceFormatted = button.getAttribute('data-variant-price-formatted');
    const variantComparePriceFormatted = button.getAttribute('data-variant-compare-price-formatted');
    const variantDiscountPercentage = parseInt(button.getAttribute('data-variant-discount-percentage'), 10);
    const variantComparePrice = parseInt(button.getAttribute('data-variant-compare-price'), 10);
    const variantPrice = parseInt(button.getAttribute('data-variant-price'), 10);

    // Update price display
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

    // Update Shopify product form so add-to-cart uses correct variant
    updateProductFormVariant(variantId);
    updateUrlVariant(variantId);

    // Update buy now buttons
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


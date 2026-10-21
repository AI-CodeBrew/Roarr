/**
 * Roarr - Hero Section (Product Split)
 * Gallery thumbnails, FAQ toggle, touch swipe, variant selection, buy now, delivery estimator
 */
(function () {
  'use strict';

  function psChangeImage(thumb, sectionId, index) {
    const track = document.getElementById('PS-Track-' + sectionId);
    if (track) {
      track.style.transform = 'translateX(-' + index * 100 + '%)';
    }
    const thumbsCol = thumb.closest('.ps-thumbs-col');
    if (thumbsCol) {
      thumbsCol.querySelectorAll('.ps-thumb').forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function pfToggleFaq(header) {
    const item = header.closest('.pf-faq-item');
    const content = item ? item.querySelector('.pf-faq-content') : null;
    if (!item || !content) return;
    const isActive = item.classList.toggle('active');
    content.style.maxHeight = isActive ? (content.scrollHeight || 300) + 'px' : '0';
  }

  function initGallery(sectionId) {
    const thumbs = document.querySelectorAll('.product-split[data-section-id="' + sectionId + '"] .ps-thumb[data-ps-thumb]');
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        const idx = parseInt(thumb.getAttribute('data-index'), 10);
        psChangeImage(thumb, sectionId, idx);
      });
    });

    const mainWrapper = document.getElementById('PS-MainWrapper-' + sectionId);
    if (mainWrapper && thumbs.length > 1) {
      var touchStartX = 0;
      var touchEndX = 0;
      mainWrapper.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      mainWrapper.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        var activeIdx = -1;
        thumbs.forEach(function (t, i) { if (t.classList.contains('is-active')) activeIdx = i; });
        var swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
          var nextIdx = (activeIdx + 1) % thumbs.length;
          thumbs[nextIdx].click();
        } else if (touchEndX > touchStartX + swipeThreshold) {
          var prevIdx = (activeIdx - 1 + thumbs.length) % thumbs.length;
          thumbs[prevIdx].click();
        }
      }, { passive: true });
    }
  }

  var faqInited = false;
  function initFaq() {
    if (faqInited) return;
    faqInited = true;
    document.addEventListener('click', function (e) {
      var header = e.target.closest('.pf-faq-header[data-pf-toggle]');
      if (header) pfToggleFaq(header);
    });
  }

  function handleVariantButtonClick(button, container) {
    var variantButtons = container.querySelectorAll('.tae-product-details-variant-btn');
    var priceCurrent = container.querySelector('[data-price-current]');
    var priceCompare = container.querySelector('[data-price-compare]');
    var discountBadge = container.querySelector('[data-discount-badge]');
    var discountText = container.querySelector('[data-discount-text]');

    variantButtons.forEach(function (btn) { btn.classList.remove('is-selected'); });
    button.classList.add('is-selected');

    var variantId = button.getAttribute('data-variant-id');
    var variantPriceFormatted = button.getAttribute('data-variant-price-formatted');
    var variantComparePriceFormatted = button.getAttribute('data-variant-compare-price-formatted');
    var variantDiscountPercentage = parseInt(button.getAttribute('data-variant-discount-percentage'), 10);
    var variantComparePrice = parseInt(button.getAttribute('data-variant-compare-price'), 10);
    var variantPrice = parseInt(button.getAttribute('data-variant-price'), 10);

    if (priceCurrent && variantPriceFormatted) priceCurrent.textContent = variantPriceFormatted;
    if (priceCompare) {
      if (variantComparePrice > variantPrice && variantComparePriceFormatted) {
        priceCompare.textContent = variantComparePriceFormatted;
        priceCompare.style.display = '';
      } else priceCompare.style.display = 'none';
    }
    if (discountBadge && discountText) {
      if (variantDiscountPercentage > 0) {
        discountText.textContent = variantDiscountPercentage + '% off';
        discountBadge.style.display = '';
      } else discountBadge.style.display = 'none';
    }

    document.querySelectorAll('.tae-buy-now-button-btn[data-variant-id]').forEach(function (b) {
      b.setAttribute('data-variant-id', variantId);
    });
    document.dispatchEvent(new CustomEvent('variantChanged', { detail: { variantId: variantId } }));
  }

  function initProductDetails() {
    document.addEventListener('click', function (e) {
      var button = e.target.closest('.tae-product-details-variant-btn');
      if (!button) return;
      var container = button.closest('.tae-product-details');
      if (!container) return;
      handleVariantButtonClick(button, container);
    });
  }

  function initBuyButton(instanceId) {
    var button = document.querySelector('.tae-buy-now-button-btn[data-instance="' + instanceId + '"]');
    var quantityInput = document.querySelector('[data-quantity-input="' + instanceId + '"]');
    var container = button ? button.closest('.tae-buy-now-button-container') : null;
    var minusBtn = container ? container.querySelector('.tae-buy-now-quantity-minus') : null;
    var plusBtn = container ? container.querySelector('.tae-buy-now-quantity-plus') : null;

    if (button) {
      if (minusBtn && quantityInput) {
        minusBtn.addEventListener('click', function () {
          var v = parseInt(quantityInput.value, 10) || 1;
          if (v > 1) quantityInput.value = v - 1;
        });
      }
      if (plusBtn && quantityInput) {
        plusBtn.addEventListener('click', function () {
          quantityInput.value = (parseInt(quantityInput.value, 10) || 1) + 1;
        });
      }
      button.addEventListener('click', function (e) {
        // Disabled: prevent any action on button click
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
      document.addEventListener('variantChanged', function (ev) {
        if (button && ev.detail && ev.detail.variantId) {
          button.setAttribute('data-variant-id', ev.detail.variantId);
        }
      });
    }
  }

  function initBuyNowButtons() {
    document.querySelectorAll('.tae-buy-now-button-btn[data-instance]').forEach(function (btn) {
      var instanceId = btn.getAttribute('data-instance');
      if (instanceId) initBuyButton(instanceId);
    });
  }

  function initDeliveryEstimators() {
    var estimators = Array.from(document.querySelectorAll('.de-fe')).filter(function (el) {
      return el.tagName && el.tagName.toLowerCase().indexOf('delivery-estimator-') === 0;
    });
    estimators.forEach(function (el) {
      var tagName = el.tagName.toLowerCase();
      if (tagName.indexOf('delivery-estimator-') === 0 && !customElements.get(tagName)) {
        var DeliveryEstimator = function () {
          return Reflect.construct(HTMLElement, [], this.constructor);
        };
        DeliveryEstimator.prototype = Object.create(HTMLElement.prototype);
        DeliveryEstimator.prototype.connectedCallback = function () {
          var steps = this.querySelectorAll('.de-fe__step');
          var today = new Date();
          steps.forEach(function (step) {
            var days = parseInt(step.dataset.days || '0', 10);
            var dt = new Date(today);
            dt.setDate(today.getDate() + days);
            var el = step.querySelector('[data-date-target]');
            if (el) {
              var opts = { month: 'short', day: 'numeric' };
              if (dt.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
              el.textContent = dt.toLocaleDateString('en-US', opts);
            }
          });
        };
        customElements.define(tagName, DeliveryEstimator);
      }
    });
  }

  function initHeroSection() {
    document.querySelectorAll('.product-split[data-section-id]').forEach(function (el) {
      var sectionId = el.getAttribute('data-section-id');
      if (sectionId) initGallery(sectionId);
    });
    initFaq();
    initProductDetails();
    initBuyNowButtons();
    initDeliveryEstimators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroSection);
  } else {
    initHeroSection();
  }

  window.initHeroSection = initHeroSection;
})();

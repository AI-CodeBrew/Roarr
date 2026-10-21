(function () {
  var initialized = {};

  /**
   * Resolves the theme header section_id for Shopify's Section Rendering API (?section_id=…).
   * Reads the live DOM: header is wrapped in #shopify-section-{section_id}.
   */
  function getHeaderSectionId() {
    /** Dawn / Horizon / Sense / Craft / Spotlight-style themes and common third-party patterns */
    var headerSelectors = [
      'header',
      '[role="banner"]',
      '#header',
      '#Header',
      '#SiteHeader',
      '#site-header',
      '#main-header',
      '#MainHeader',
      '.site-header',
      '.main-header',
      '.shopify-section-header',
      '[data-header]',
      '[data-main-header]',
      '[data-section-type="header"]',
      '[data-shopify="header"]',
      'sticky-header',
      'shopify-header',
      '.header-wrapper',
      '.header__wrapper',
      '.header--wrapper',
      '.header-group',
      '.header-section',
      '.shopify-section-group-header-group',
      '.header',
    ];
    var section = null;
    for (var h = 0; h < headerSelectors.length; h++) {
      var headerEl = document.querySelector(headerSelectors[h]);
      if (!headerEl) {
        continue;
      }
      section = headerEl.closest('[id^="shopify-section-"]');
      if (section && section.id) {
        return section.id.replace(/^shopify-section-/, '');
      }
    }
    var nodes = document.querySelectorAll('[id^="shopify-section-"]');
    for (var i = 0; i < nodes.length; i++) {
      var sid = nodes[i].id.replace(/^shopify-section-/, '');
      if (/header/i.test(sid)) {
        return sid;
      }
    }
    return null;
  }

  function replaceSectionFromFetchedHtml(sectionId, htmlString) {
    var wrapperId = 'shopify-section-' + sectionId;
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    var incoming = doc.getElementById(wrapperId);
    var current = document.getElementById(wrapperId);
    if (incoming && current) {
      current.innerHTML = incoming.innerHTML;
      return true;
    }
    incoming = doc.querySelector('[id^="shopify-section-"]');
    if (incoming && current) {
      current.innerHTML = incoming.innerHTML;
      return true;
    }
    return false;
  }

  function setAddToCartLoading(button, loading) {
    if (!button || !button.classList || !button.classList.contains('tae-add-to-cart-submit')) {
      return;
    }
    if (loading) {
      button.classList.add('tae-add-to-cart-submit--loading');
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      button.classList.remove('tae-add-to-cart-submit--loading');
      button.disabled = false;
      button.setAttribute('aria-busy', 'false');
    }
  }

  function fetchAndReplaceHeaderSection() {
    var sectionId = getHeaderSectionId();
    if (!sectionId) {
      return Promise.resolve(false);
    }
    var url = new URL(window.location.href);
    url.searchParams.set('section_id', sectionId);
    return fetch(url.toString(), {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Section fetch failed');
        }
        return res.text();
      })
      .then(function (html) {
        return replaceSectionFromFetchedHtml(sectionId, html);
      })
      .catch(function () {
        return false;
      });
  }

  function initBuyButton(instanceId) {
    if (initialized[instanceId]) {
      return;
    }

    const form = document.querySelector('#buy-now-form-' + instanceId);

    if (!form) {
      return;
    }

    const quantityInput = form.querySelector('input[name="quantity"]');
    const variantInput = form.querySelector('input[name="id"]');
    const minusBtn = form.querySelector('.tae-buy-now-quantity-minus');
    const plusBtn = form.querySelector('.tae-buy-now-quantity-plus');

    // Handle quantity controls
    if (minusBtn && quantityInput) {
      minusBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
        }
      });
    }

    if (plusBtn && quantityInput) {
      plusBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const currentValue = parseInt(quantityInput.value) || 1;
        quantityInput.value = currentValue + 1;
      });
    }

    initialized[instanceId] = true;

    // Handle input validation
    if (quantityInput) {
      quantityInput.addEventListener('change', function () {
        const value = parseInt(this.value) || 1;
        if (value < 1) {
          this.value = 1;
        }
      });
    }

    // Listen for variant changes from product details
    document.addEventListener('variantChanged', function (event) {
      if (variantInput && event.detail && event.detail.variantId) {
        variantInput.value = event.detail.variantId;
      }
    });

    // Handle form submission: Add to cart stays on cart add; other submits go to checkout
    form.addEventListener('submit', function (event) {
      var submitter = event.submitter;
      var isAddToCart =
        submitter &&
        submitter.classList &&
        submitter.classList.contains('tae-add-to-cart-submit');

      event.preventDefault();

      var addToCartBtn = isAddToCart ? submitter : null;
      if (addToCartBtn) {
        setAddToCartLoading(addToCartBtn, true);
      }

      var formData = new FormData(form);
      var payload = {
        id: formData.get('id'),
        quantity: parseInt(formData.get('quantity'), 10) || 1
      };

      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Add to cart failed');
          }
          return response.json();
        })
        .then(function () {
          if (!isAddToCart) {
            window.location.href = '/checkout';
            return;
          }
          return fetch('/cart.js', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then(function (response) {
              return response.json();
            })
            .then(function () {
              return fetchAndReplaceHeaderSection();
            });
        })
        .then(function () {
          if (isAddToCart) {
            document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
          }
        })
        .catch(function (error) {
          console.error('Error:', error);
          window.location.href = '/cart';
        })
        .finally(function () {
          if (addToCartBtn) {
            setAddToCartLoading(addToCartBtn, false);
          }
        });
    });
  }

  function initialize() {
    const forms = document.querySelectorAll('[id^="buy-now-form-"]');
    forms.forEach(function (form) {
      const formId = form.getAttribute('id');
      if (formId) {
        const instanceId = formId.replace('buy-now-form-', '');
        initBuyButton(instanceId);
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Also try to initialize after a short delay to catch dynamically loaded content
  setTimeout(initialize, 500);
})();


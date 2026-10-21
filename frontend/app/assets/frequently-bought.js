(function() {
  function initializeWrapper(wrapper) {
    if (!wrapper || wrapper.dataset.fbtInitialized === 'true') return;
    wrapper.dataset.fbtInitialized = 'true';

    wrapper.querySelectorAll('.fbt-qty-btn').forEach((btn) => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const input = this.parentElement.querySelector('.fbt-qty-input');
        if (!input) return;
        const val = parseInt(input.value || '1', 10);
        if (this.classList.contains('plus')) {
          input.value = String(val + 1);
        } else if (val > 1) {
          input.value = String(val - 1);
        }
      });
    });

    wrapper.querySelectorAll('.fbt-add-btn').forEach((btn) => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();

        const card = this.closest('.fbt-card');
        if (!card) return;

        const variantId = card.dataset.variantId;
        const qtyInput = card.querySelector('.fbt-qty-input');
        const qty = parseInt((qtyInput && qtyInput.value) || '1', 10);
        if (!variantId) return;

        const txtSpan = this.querySelector('.txt');
        const loaderSpan = this.querySelector('.loader');
        const originalText = txtSpan ? txtSpan.textContent : '';

        if (txtSpan) txtSpan.style.display = 'none';
        if (loaderSpan) loaderSpan.style.display = 'inline';
        this.disabled = true;

        // fetch('/cart/add.js', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     items: [{ id: variantId, quantity: qty }]
        //   })
        // })
        //   .then((res) => {
        //     if (!res.ok) throw new Error('Add to cart failed');
        //     return res.json();
        //   })
        //   .then((data) => {
        //     if (loaderSpan) loaderSpan.style.display = 'none';
        //     if (txtSpan) {
        //       txtSpan.textContent = 'Added';
        //       txtSpan.style.display = 'inline';
        //     }

        //     setTimeout(() => {
        //       if (txtSpan) txtSpan.textContent = originalText;
        //       this.disabled = false;
        //     }, 2000);

        //     document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
        //     const item = data && data.items ? data.items[0] : null;
        //     document.body.dispatchEvent(
        //       new CustomEvent('cart:item-added', {
        //         bubbles: true,
        //         detail: { item: item }
        //       })
        //     );
        //   })
        //   .catch((err) => {
        //     console.error(err);
        //     if (loaderSpan) loaderSpan.style.display = 'none';
        //     if (txtSpan) {
        //       txtSpan.textContent = 'Error';
        //       txtSpan.style.display = 'inline';
        //     }
        //     setTimeout(() => {
        //       if (txtSpan) txtSpan.textContent = originalText;
        //       this.disabled = false;
        //     }, 2000);
        //   });
      });
    });
  }

  function initializeAll() {
    document.querySelectorAll('.fbt-widget-wrapper').forEach(initializeWrapper);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
  } else {
    initializeAll();
  }

  // Re-initialize when Shopify editor re-renders sections/blocks.
  document.addEventListener('shopify:section:load', initializeAll);
  document.addEventListener('shopify:block:select', initializeAll);

  // Expose for liquid preview reinit
  window.initFrequentlyBought = initializeAll;
})();

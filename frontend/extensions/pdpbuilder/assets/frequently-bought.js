(function() {
  // Use event delegation so quantity selector and add button work even when
  // the FBT block is rendered after the script runs (e.g. section rendering, tabs).
  function handleClick(e) {
    const wrapper = e.target.closest('.fbt-widget-wrapper');
    if (!wrapper) return;

    // Quantity +/- buttons
    const qtyBtn = e.target.closest('.fbt-qty-btn');
    if (qtyBtn) {
      e.preventDefault();
      const control = qtyBtn.closest('.fbt-qty-control');
      const input = control && control.querySelector('.fbt-qty-input');
      if (!input) return;
      const val = parseInt(input.value || '1', 10) || 1;
      if (qtyBtn.classList.contains('plus')) {
        input.value = String(val + 1);
      } else if (val > 1) {
        input.value = String(val - 1);
      }
      return;
    }

    // Add to cart button
    const addBtn = e.target.closest('.fbt-add-btn');
    if (!addBtn) return;

    e.preventDefault();
    const card = addBtn.closest('.fbt-card');
    if (!card) return;

    const variantIdRaw = card.getAttribute('data-variant-id') || card.dataset.variantId;
    const variantId = variantIdRaw ? parseInt(variantIdRaw, 10) : 0;
    const qtyInput = card.querySelector('.fbt-qty-input');
    const qty = parseInt((qtyInput && qtyInput.value) || '1', 10) || 1;
    if (!variantId) return;

    const txtSpan = addBtn.querySelector('.txt');
    const loaderSpan = addBtn.querySelector('.loader');
    const originalText = txtSpan ? txtSpan.textContent : '';

    if (txtSpan) txtSpan.style.display = 'none';
    if (loaderSpan) loaderSpan.style.display = 'inline';
    addBtn.disabled = true;

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: variantId, quantity: qty }]
      })
    })
      .then(function(res) {
        if (!res.ok) throw new Error('Add to cart failed');
        return res.json();
      })
      .then(function(data) {
        if (loaderSpan) loaderSpan.style.display = 'none';
        if (txtSpan) {
          txtSpan.textContent = 'Added';
          txtSpan.style.display = 'inline';
        }
        setTimeout(function() {
          if (txtSpan) txtSpan.textContent = originalText;
          addBtn.disabled = false;
        }, 2000);
        document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
        const item = data && data.items ? data.items[0] : (data && data.id ? data : null);
        document.body.dispatchEvent(
          new CustomEvent('cart:item-added', {
            bubbles: true,
            detail: { item: item }
          })
        );
      })
      .catch(function(err) {
        console.error('[FBT] Add to cart failed:', err);
        if (loaderSpan) loaderSpan.style.display = 'none';
        if (txtSpan) {
          txtSpan.textContent = 'Error';
          txtSpan.style.display = 'inline';
        }
        setTimeout(function() {
          if (txtSpan) txtSpan.textContent = originalText;
          addBtn.disabled = false;
        }, 2000);
      });
  }

  document.addEventListener('click', handleClick, true);
})();

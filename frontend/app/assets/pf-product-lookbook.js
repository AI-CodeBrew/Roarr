/**
 * Shoppable Bundle - Add All To Cart
 * In preview mode (no Shopify), shows message instead of API call
 */

(function() {
  'use strict';

  function initProductLookbook() {
    document.querySelectorAll('[id^="AddBundle-"]').forEach(addButton => {
      if (addButton.dataset.initialized === 'true') return;
      addButton.dataset.initialized = 'true';

      const containerId = addButton.id.replace('AddBundle-', 'BundleItems-');
      const container = document.getElementById(containerId);

      if (!addButton || !container) return;

      addButton.addEventListener('click', function(e) {
        e.preventDefault();

        if (!window.Shopify?.routes?.root) {
          addButton.innerText = 'Preview mode';
          setTimeout(() => {
            addButton.innerText = addButton.dataset.originalText || 'Add All To Cart';
          }, 1500);
          return;
        }

        addButton.classList.add('loading');
        const originalText = addButton.innerText;
        addButton.innerText = 'Adding...';

        const selectElements = container.querySelectorAll('.bundle-variant-select');
        const itemsToAdd = [];

        selectElements.forEach(select => {
          if (select.value) {
            itemsToAdd.push({ id: select.value, quantity: 1 });
          }
        });

        if (itemsToAdd.length === 0) {
          alert('No products available to add.');
          addButton.classList.remove('loading');
          addButton.innerText = originalText;
          return;
        }

        fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToAdd })
        })
          .then(response => response.json())
          .then(data => {
            if (data.status) {
              alert('Error: ' + (data.description || 'Unknown error'));
              return;
            }
            return fetch(window.location.href);
          })
          .then(response => response?.text())
          .then(html => {
            if (!html) return;
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            const currentDrawer = document.querySelector('cart-drawer-component');
            const newDrawer = newDoc.querySelector('cart-drawer-component');
            if (currentDrawer && newDrawer) {
              currentDrawer.innerHTML = newDrawer.innerHTML;
              currentDrawer.classList.remove('cart-drawer--empty');
              setTimeout(() => {
                if (typeof currentDrawer.open === 'function') {
                  currentDrawer.open();
                } else {
                  const dialog = currentDrawer.querySelector('dialog');
                  if (dialog) {
                    dialog.setAttribute('open', '');
                    dialog.classList.add('active');
                  }
                  document.body.classList.add('overflow-hidden');
                }
              }, 50);
            }
            const currentIcon = document.querySelector('cart-icon-component');
            const newIcon = newDoc.querySelector('cart-icon-component');
            if (currentIcon && newIcon) {
              currentIcon.innerHTML = newIcon.innerHTML;
            }
          })
          .catch(err => {
            console.error('Add to cart error:', err);
          })
          .finally(() => {
            addButton.classList.remove('loading');
            addButton.innerText = originalText;
          });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductLookbook);
  } else {
    initProductLookbook();
  }

  if (typeof window !== 'undefined') {
    window.initProductLookbook = initProductLookbook;
  }
})();

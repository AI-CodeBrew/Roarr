(function() {
  function initBuyButton(instanceId) {
    const button = document.querySelector('.tae-buy-now-button-btn-' + instanceId);
    const quantityInput = document.querySelector('[data-quantity-input-' + instanceId + ']');
    const minusBtn = button?.closest('.tae-buy-now-button-container')?.querySelector('.tae-buy-now-quantity-minus');
    const plusBtn = button?.closest('.tae-buy-now-button-container')?.querySelector('.tae-buy-now-quantity-plus');
    
    if (button) {
      // Handle quantity controls
      if (minusBtn && quantityInput) {
        minusBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value) || 1;
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
          }
        });
      }
      
      if (plusBtn && quantityInput) {
        plusBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value) || 1;
          quantityInput.value = currentValue + 1;
        });
      }
      
      // Handle input validation
      if (quantityInput) {
        quantityInput.addEventListener('change', function() {
          const value = parseInt(this.value) || 1;
          if (value < 1) {
            this.value = 1;
          }
        });
      }
      
      // Handle buy now button click
      button.addEventListener('click', function() {
        // Always read the variant ID fresh from the attribute
        const variantId = this.getAttribute('data-variant-id');
        if (!variantId) {
          console.error('Variant ID not found');
          return;
        }
        
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: quantity
          })
        })
        .then(response => response.json())
        .then(data => {
          window.location.href = '/checkout';
        })
        .catch(error => {
          console.error('Error:', error);
          window.location.href = '/cart';
        });
      });
      
      // Listen for variant changes from product details
      document.addEventListener('variantChanged', function(event) {
        if (button && event.detail && event.detail.variantId) {
          button.setAttribute('data-variant-id', event.detail.variantId);
        }
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const buttons = document.querySelectorAll('[class*="tae-buy-now-button-btn-"]');
      buttons.forEach(function(button) {
        const classList = button.className.split(' ');
        const instanceClass = classList.find(cls => cls.startsWith('tae-buy-now-button-btn-'));
        if (instanceClass) {
          const instanceId = instanceClass.replace('tae-buy-now-button-btn-', '');
          initBuyButton(instanceId);
        }
      });
    });
  } else {
    const buttons = document.querySelectorAll('[class*="tae-buy-now-button-btn-"]');
    buttons.forEach(function(button) {
      const classList = button.className.split(' ');
      const instanceClass = classList.find(cls => cls.startsWith('tae-buy-now-button-btn-'));
      if (instanceClass) {
        const instanceId = instanceClass.replace('tae-buy-now-button-btn-', '');
        initBuyButton(instanceId);
      }
    });
  }
})();


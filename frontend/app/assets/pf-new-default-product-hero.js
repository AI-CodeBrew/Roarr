/**
 * Modern Product Hero - Interactive functionality
 * Handles variant selection, image gallery, accordions, and sticky cart
 */

(function() {
  'use strict';

  function initModernProductHero() {
    const sections = document.querySelectorAll('[id^="ModernProduct-"]');
    sections.forEach(section => {
      if (section.dataset.pfInitialized) return;
      section.dataset.pfInitialized = '1';
      const sectionId = section.id.replace('ModernProduct-', '');
      initProductSection(section, sectionId);
    });
  }

  function initProductSection(section, sectionId) {
    // Read variant data from data attribute to avoid script-tag escaping issues
    let variantData = [];
    const raw = section.getAttribute('data-variants');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        variantData = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Could not parse variant data for section:', sectionId);
      }
    }

    try { initVariantSelection(section, variantData); } catch(e) { console.warn('initVariantSelection failed', e); }
    try { initQuantityControls(section); } catch(e) { console.warn('initQuantityControls failed', e); }
    try { initImageGallery(section, sectionId); } catch(e) { console.warn('initImageGallery failed', e); }
    try { initStickyCart(section, sectionId); } catch(e) { console.warn('initStickyCart failed', e); }
  }

  function initVariantSelection(section, variantData) {
    const variantButtons = section.querySelectorAll('.modern-variant__btn, .modern-variant__swatch');
    const variantInput = section.querySelector('.product-variant-id');

    variantButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const parentOptions = this.closest('.modern-variant__options');
        
        // Remove active class from siblings
        parentOptions.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        
        // Add active class to clicked button
        this.classList.add('is-active');
        
        // Update variant label text
        const variantLabel = parentOptions.previousElementSibling;
        if (variantLabel && variantLabel.classList.contains('modern-variant__label')) {
          const labelText = variantLabel.textContent.split(':')[0];
          const selectedValue = this.getAttribute('data-value') || this.textContent;
          variantLabel.innerHTML = `${labelText}: <span style="font-weight:400;">${selectedValue}</span>`;
        }
        
        // Find matching variant
        const selectedValues = Array.from(section.querySelectorAll('.modern-variant__options .is-active'))
          .map(b => b.getAttribute('data-value'));
        
        const matchedVariant = variantData.find(v => 
          v.options && v.options.every((val, i) => val === selectedValues[i])
        );
        
        if (matchedVariant && variantInput) {
          variantInput.value = matchedVariant.id;
          
          // Update URL without page reload
          if (window.history && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.set('variant', matchedVariant.id);
            window.history.replaceState({}, '', url);
          }
          
          // Update price if price element exists
          updatePrice(section, matchedVariant);
          
          // Update availability
          updateAvailability(section, matchedVariant);
        }
      });
    });
  }

  function updatePrice(section, variant) {
    const priceElement = section.querySelector('.modern-product__price');
    const comparePriceElement = section.querySelector('.modern-product__compare-price');
    
    if (priceElement && variant.price !== undefined) {
      // Format price (assuming price is in cents)
      const formattedPrice = formatMoney(variant.price);
      priceElement.textContent = formattedPrice;
    }
    
    if (comparePriceElement && variant.compare_at_price) {
      if (variant.compare_at_price > variant.price) {
        const formattedComparePrice = formatMoney(variant.compare_at_price);
        comparePriceElement.textContent = formattedComparePrice;
        comparePriceElement.style.display = 'inline';
      } else {
        comparePriceElement.style.display = 'none';
      }
    }
  }

  function updateAvailability(section, variant) {
    const addToCartBtn = section.querySelector('.modern-btn--add');
    
    if (addToCartBtn) {
      const btnText = addToCartBtn.querySelector('span');
      
      if (variant.available) {
        addToCartBtn.disabled = false;
        if (btnText) btnText.textContent = addToCartBtn.getAttribute('data-add-text') || 'Add to Cart';
      } else {
        addToCartBtn.disabled = true;
        if (btnText) btnText.textContent = 'Sold out';
      }
    }
  }

  function formatMoney(cents) {
    // Basic money formatting - you might want to use Shopify's money format
    return '$' + (cents / 100).toFixed(2);
  }

  function initQuantityControls(section) {
    const qtyContainer = section.querySelector('.modern-qty');
    if (!qtyContainer) return;

    const qtyBtns = qtyContainer.querySelectorAll('.modern-qty__btn');
    const minusBtn = qtyBtns[0];
    const plusBtn = qtyBtns[1];
    const qtyInput = qtyContainer.querySelector('.modern-qty__input');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value) || 1;
        if (currentValue > 1) {
          qtyInput.value = currentValue - 1;
        }
      });

      plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value) || 1;
        qtyInput.value = currentValue + 1;
      });

      // Ensure minimum value of 1
      qtyInput.addEventListener('change', () => {
        const value = parseInt(qtyInput.value) || 1;
        qtyInput.value = Math.max(1, value);
      });
    }
  }

  function initImageGallery(section, sectionId) {
    const slider = section.querySelector(`#Slider-${sectionId}`);
    if (!slider) return;

    const slides = section.querySelectorAll('.modern-product__slide');
    const thumbs = section.querySelectorAll('.modern-product__thumb');
    const prevBtn = section.querySelector('.modern-product__arrow--prev');
    const nextBtn = section.querySelector('.modern-product__arrow--next');

    // Navigation arrows
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -slider.offsetWidth, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: slider.offsetWidth, behavior: 'smooth' });
      });
    }

    // Thumbnail clicks
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        if (slides[index]) {
          slider.scrollTo({ left: slides[index].offsetLeft, behavior: 'smooth' });
        }
      });
    });

    // Update active thumbnail based on visible slide
    if (slides.length > 0 && thumbs.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Array.from(slides).indexOf(entry.target);
            
            // Update thumbnail active state
            thumbs.forEach(t => t.classList.remove('is-active'));
            if (thumbs[index]) {
              thumbs[index].classList.add('is-active');

              // Scroll only within the thumbs row — never the page
              // (scrollIntoView would jump the homepage down to checkout).
              const row = thumbs[index].closest('.modern-product__thumbs');
              if (row) {
                const thumb = thumbs[index];
                const left =
                  thumb.offsetLeft - (row.clientWidth - thumb.clientWidth) / 2;
                row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
              }
            }
          }
        });
      }, { 
        root: slider, 
        threshold: 0.5 
      });

      slides.forEach(slide => observer.observe(slide));
    }
  }

  function initStickyCart(section, sectionId) {
    const buyButton = section.querySelector(`#MainAddToCart-${sectionId}`);
    const stickyCart = document.getElementById(`StickyCart-${sectionId}`);
    
    if (!buyButton || !stickyCart) return;

    // Move sticky cart to body to ensure proper z-index stacking
    document.body.appendChild(stickyCart);

    // Observer to show/hide sticky cart
    const cartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          stickyCart.classList.add('is-visible');
        } else {
          stickyCart.classList.remove('is-visible');
        }
      });
    }, { threshold: 0 });

    cartObserver.observe(buyButton);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModernProductHero);
  } else {
    initModernProductHero();
  }

  // Re-initialize for dynamically loaded sections (e.g., theme editor)
  document.addEventListener('shopify:section:load', function(event) {
    const section = event.target.querySelector('[id^="ModernProduct-"]');
    if (section) {
      const sectionId = section.id.replace('ModernProduct-', '');
      initProductSection(section, sectionId);
    }
  });

  // Expose on window for reinit hooks
  window.initModernProductHero = initModernProductHero;

})();
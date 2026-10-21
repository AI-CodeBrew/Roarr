(function() {
  'use strict';

  function initFourBlocksCarousel() {
    const carousels = document.querySelectorAll('.tae-four-blocks [data-carousel]');
    
    carousels.forEach(carousel => {
      const track = carousel.querySelector('[data-track]');
      const items = track.querySelectorAll('.tae-four-blocks-item');
      const dotsContainer = carousel.querySelector('[data-dots]');
      const prevBtn = carousel.querySelector('[data-prev]');
      const nextBtn = carousel.querySelector('[data-next]');
      
      if (items.length === 0) return;
      
      let currentIndex = 0;
      let isMobile = window.innerWidth <= 767;

      // Equalize heights for layout 1 cards (Option 1) so all blocks
      // in the row have the same visual height.
      function equalizeLayout1Heights() {
        const layout1Items = track.querySelectorAll('.tae-four-blocks-item--layout-1');
        if (!layout1Items.length) return;

        // Reset any previous explicit heights
        layout1Items.forEach(item => {
          item.style.minHeight = '';
        });

        let maxHeight = 0;
        layout1Items.forEach(item => {
          const h = item.offsetHeight;
          if (h > maxHeight) maxHeight = h;
        });

        if (maxHeight > 0) {
          layout1Items.forEach(item => {
            item.style.minHeight = maxHeight + 'px';
          });
        }
      }

      // Equalize heights for layout 2 text cards (Option 2) so all
      // text cards in the row have the same height regardless of content.
      function equalizeLayout2TextCards() {
        const layout2Cards = track.querySelectorAll('.tae-four-blocks-item--layout-2 .tae-four-blocks-text-card');
        if (!layout2Cards.length) return;

        // Reset any previous explicit heights
        layout2Cards.forEach(card => {
          card.style.minHeight = '';
          card.style.height = '';
        });

        let maxHeight = 0;
        layout2Cards.forEach(card => {
          const h = card.offsetHeight;
          if (h > maxHeight) maxHeight = h;
        });

        if (maxHeight > 0) {
          layout2Cards.forEach(card => {
            card.style.minHeight = maxHeight + 'px';
            card.style.height = maxHeight + 'px';
          });
        }
      }

      function scheduleEqualize() {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            equalizeLayout1Heights();
            equalizeLayout2TextCards();
          });
        });
      }
      
      function slidesPerView() {
        return window.innerWidth <= 767 ? 1 : 3;
      }
      
      // Function to check if carousel is needed
      function needsCarousel() {
        return items.length > slidesPerView();
      }
      
      // Create dots dynamically
      function createDots() {
        if (!dotsContainer) return;
        
        if (!needsCarousel() || items.length <= 1) {
          dotsContainer.style.display = 'none';
          return;
        }
        
        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < items.length; i++) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'tae-four-blocks-dot';
          if (i === 0) dot.classList.add('is-active');
          dot.setAttribute('data-index', i);
          dot.setAttribute('aria-label', `Go to block ${i + 1}`);
          dot.addEventListener('click', () => goToSlide(i));
          dotsContainer.appendChild(dot);
        }
      }
      
      // Function to go to specific slide
      function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, items.length - 1));
        updateCarousel();
      }
      
      function getOffsetForIndex(index) {
        const clamped = Math.max(0, Math.min(index, items.length - 1));
        const target = items[clamped];
        if (!target) return 0;
        return target.offsetLeft;
      }

      // Function to update carousel position
      function updateCarousel() {
        const perView = slidesPerView();
        isMobile = window.innerWidth <= 767;
        const carouselNeeded = needsCarousel();
        
        // update CSS var for item width
        carousel.style.setProperty('--four-blocks-slides-per-view', perView);
        
        if (!carouselNeeded) {
          track.style.transform = 'translateX(0)';
          if (prevBtn) prevBtn.disabled = true;
          if (nextBtn) nextBtn.disabled = true;

          // Normalize heights even when carousel isn't needed.
          scheduleEqualize();
          return;
        }
        
        const maxIndex = Math.max(0, items.length - perView);
        currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
        
        const offset = getOffsetForIndex(currentIndex);
        track.style.transform = `translateX(${-offset}px)`;
        
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === maxIndex;

        // After layout/width changes are applied, normalize heights
        scheduleEqualize();
      }
      
      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const wasMobile = isMobile;
          isMobile = needsCarousel();
          
          if (wasMobile !== isMobile) {
            currentIndex = 0;
          }
          
          updateCarousel();
          // Re-equalize heights after resize as content may wrap differently
          scheduleEqualize();
        }, 250);
      });
      
      // Touch/swipe support for mobile
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      
      track.addEventListener('touchstart', (e) => {
        if (!needsCarousel() || !isMobile) return;
        startX = e.touches[0].clientX;
        isDragging = true;
        track.style.transition = 'none';
      });
      
      track.addEventListener('touchmove', (e) => {
        if (!isDragging || !needsCarousel() || !isMobile) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        const baseTranslate = -getOffsetForIndex(currentIndex);
        const translate = baseTranslate - diff;
        track.style.transform = `translateX(${translate}px)`;
      });
      
      track.addEventListener('touchend', () => {
        if (!isDragging || !needsCarousel() || !isMobile) return;
        isDragging = false;
        track.style.transition = 'transform 0.4s ease';
        
        const diff = startX - currentX;
        const slideWidth = items[0] ? items[0].offsetWidth : track.offsetWidth;
        const threshold = slideWidth * 0.3;
        
        if (Math.abs(diff) > threshold) {
          if (diff > 0 && currentIndex < items.length - 1) {
            currentIndex++;
          } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
          }
        }
        
        updateCarousel();
      });
      
      // Chevron navigation for desktop/tablet
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (!needsCarousel()) return;
          currentIndex = Math.max(0, currentIndex - 1);
          updateCarousel();
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (!needsCarousel()) return;
          currentIndex = Math.min(items.length - slidesPerView(), currentIndex + 1);
          updateCarousel();
        });
      }
      
      // Initialize
      updateCarousel();

      // Equalize heights once images are loaded (important for both layouts)
      const allImages = track.querySelectorAll('img');
      if (allImages.length) {
        let pending = 0;
        allImages.forEach(img => {
          if (img.complete) return;
          pending += 1;
          img.addEventListener('load', () => {
            pending -= 1;
            if (pending <= 0) {
              scheduleEqualize();
            }
          });
        });
      } else {
        // No images or already loaded – still ensure equal heights once
        scheduleEqualize();
      }

      // Recalculate after fonts finish loading (text wrapping can change heights).
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          scheduleEqualize();
        });
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFourBlocksCarousel);
  } else {
    initFourBlocksCarousel();
  }
})();


(function() {
  'use strict';

  function initImageGallery() {
    const carousels = document.querySelectorAll('[data-carousel]');
    
    carousels.forEach(carousel => {
      const track = carousel.querySelector('[data-track]');
      const slides = track.querySelectorAll('.tae-image-gallery-slide');
      const dotsContainer = carousel.querySelector('[data-dots]');
      
      if (slides.length === 0) return;
      
      let currentIndex = 0;
      let slidesToShow = getSlidesToShow();
      
      // Function to get number of slides to show based on viewport
      function getSlidesToShow() {
        const width = window.innerWidth;
        if (width >= 768) return 3; // Desktop and Tablet
        return 1; // Mobile
      }
      
      // Calculate number of dots needed based on slides and slidesToShow
      function getDotsCount() {
        if (slidesToShow >= slides.length) return 0;
        // For mobile (1 slide), we need one dot per slide
        // For tablet (2 slides), we need dots for each possible position
        // For desktop (3 slides), no dots needed
        if (slidesToShow === 1) {
          return slides.length;
        } else if (slidesToShow === 2) {
          // With 3 images showing 2 at a time, we can show: [1,2] and [2,3] or just [1,2] and [3]
          // Let's show: [1,2] and [3] = 2 dots
          return Math.max(1, slides.length - slidesToShow + 1);
        }
        return 0;
      }
      
      // Create dots dynamically
      function createDots() {
        if (!dotsContainer) return;
        
        // Clear existing dots
        dotsContainer.innerHTML = '';
        
        const dotsCount = getDotsCount();
        
        // Only show dots if carousel is needed
        if (dotsCount <= 1) {
          dotsContainer.style.display = 'none';
          return;
        }
        
        dotsContainer.style.display = 'flex';
        
        for (let i = 0; i < dotsCount; i++) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'tae-image-gallery-dot';
          if (i === 0) dot.classList.add('is-active');
          dot.setAttribute('data-index', i);
          dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
          dot.addEventListener('click', () => goToSlide(i));
          dotsContainer.appendChild(dot);
        }
      }
      
      // Function to go to specific slide group
      function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, getDotsCount() - 1));
        updateCarousel();
      }
      
      // Function to update carousel position
      function updateCarousel() {
        slidesToShow = getSlidesToShow();
        
        // Update dots if needed
        createDots();
        
        // If all slides are visible, no need to transform
        if (slidesToShow >= slides.length) {
          track.style.transform = 'translateX(0)';
          return;
        }
        
        // Calculate how many slides we need to move
        // For mobile (1 slide): move by 1 slide per dot (100% per slide)
        // For tablet (2 slides): move by 1 slide per dot (so we see different pairs)
        const slideWidth = 100 / slidesToShow;
        const translateX = -(currentIndex * slideWidth);
        track.style.transform = `translateX(${translateX}%)`;
        
        // Update dots active state
        const dots = dotsContainer.querySelectorAll('.tae-image-gallery-dot');
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-active', index === currentIndex);
        });
      }
      
      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const oldSlidesToShow = slidesToShow;
          slidesToShow = getSlidesToShow();
          
          // Recalculate current index if slides to show changed
          if (oldSlidesToShow !== slidesToShow) {
            currentIndex = 0;
          }
          
          updateCarousel();
        }, 250);
      });
      
      // Touch/swipe support for mobile
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      
      track.addEventListener('touchstart', (e) => {
        if (slidesToShow >= slides.length) return;
        startX = e.touches[0].clientX;
        isDragging = true;
        track.style.transition = 'none';
      });
      
      track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        const slideWidth = track.offsetWidth;
        const slideWidthPercent = 100 / slidesToShow;
        const baseTranslate = -(currentIndex * slideWidthPercent);
        const translatePercent = baseTranslate - (diff / slideWidth * 100);
        track.style.transform = `translateX(${translatePercent}%)`;
      });
      
      track.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.4s ease';
        
        const diff = startX - currentX;
        const slideWidth = track.offsetWidth;
        const threshold = slideWidth * 0.3;
        
        if (Math.abs(diff) > threshold) {
          if (diff > 0 && currentIndex < getDotsCount() - 1) {
            currentIndex++;
          } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
          }
        }
        
        updateCarousel();
      });
      
      // Initialize
      updateCarousel();
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageGallery);
  } else {
    initImageGallery();
  }
})();


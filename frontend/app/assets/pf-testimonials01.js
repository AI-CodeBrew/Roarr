/**
 * Testimonials Slider - Navigation functionality
 * Handles prev/next button clicks for desktop slider navigation
 */

(function() {
  'use strict';

  function initTestimonialsSlider() {
    // Find all testimonial slider sections
    const sections = document.querySelectorAll('.ts-section');
    
    sections.forEach(section => {
      const sectionId = section.id;
      if (!sectionId) return;

      // Extract section ID number from full ID (e.g., "shopify-section-123" -> "123")
      const sectionIdNum = sectionId.replace('shopify-section-', '');
      const sliderId = `slider-${sectionIdNum}`;
      const prevBtnId = `prev-${sectionIdNum}`;
      const nextBtnId = `next-${sectionIdNum}`;

      const slider = document.getElementById(sliderId);
      const prevBtn = document.getElementById(prevBtnId);
      const nextBtn = document.getElementById(nextBtnId);

      if (!slider || !prevBtn || !nextBtn) return;

      // Get card width dynamically
      const getCardWidth = () => {
        const firstCard = slider.querySelector('.ts-card');
        if (!firstCard) return 0;
        return firstCard.offsetWidth;
      };

      // Get gap between cards
      const getGap = () => {
        const computedStyle = window.getComputedStyle(slider);
        return parseInt(computedStyle.gap) || 20;
      };

      // Next button handler
      nextBtn.addEventListener('click', () => {
        const cardWidth = getCardWidth();
        const gap = getGap();
        slider.scrollBy({
          left: cardWidth + gap,
          behavior: 'smooth'
        });
      });

      // Previous button handler
      prevBtn.addEventListener('click', () => {
        const cardWidth = getCardWidth();
        const gap = getGap();
        slider.scrollBy({
          left: -(cardWidth + gap),
          behavior: 'smooth'
        });
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsSlider);
  } else {
    initTestimonialsSlider();
  }

  // Reinit hook for dynamic content updates
  if (typeof window !== 'undefined') {
    window.initTestimonialsSlider = initTestimonialsSlider;
  }
})();

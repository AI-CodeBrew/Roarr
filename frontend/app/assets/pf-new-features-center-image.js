/**
 * Features Center Image - Intersection Observer for scroll animations
 * Animates feature items when they come into view
 */

(function() {
  'use strict';

  function initFeaturesCenterImage() {
    // Find all feature center image sections
    const sections = document.querySelectorAll('.fci-section');
    
    sections.forEach(section => {
      const sectionId = section.id || section.getAttribute('id');
      if (!sectionId) return;

      // Create Intersection Observer for this section
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            }
          });
        },
        { threshold: 0.1 } // Triggers when 10% of the item is visible
      );

      // Observe all feature items in this section
      const items = section.querySelectorAll('.fci-item');
      items.forEach(item => {
        observer.observe(item);
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturesCenterImage);
  } else {
    initFeaturesCenterImage();
  }

  // Reinit hook for dynamic content updates
  if (typeof window !== 'undefined') {
    window.initFeaturesCenterImage = initFeaturesCenterImage;
  }
})();

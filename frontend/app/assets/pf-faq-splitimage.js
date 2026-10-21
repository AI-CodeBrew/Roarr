/**
 * FAQ & Showcase - Accordion functionality
 * Handles smooth accordion expand/collapse with height animations
 */

(function() {
  'use strict';

  function initFaqSplitImage() {
    // Find all FAQ sections
    const sections = document.querySelectorAll('[id^="fs-"]');
    
    sections.forEach(section => {
      const faqCol = section.querySelector('.fs-faq-col');
      if (!faqCol) return;

      const faqItems = faqCol.querySelectorAll('.fs-faq-item');
      
      faqItems.forEach(item => {
        const header = item.querySelector('.fs-faq-header');
        const content = item.querySelector('.fs-faq-content');
        
        if (!header || !content) return;

        // Skip if already initialized
        if (header.dataset.initialized === 'true') return;
        header.dataset.initialized = 'true';
        
        // Attach click handler
        header.addEventListener('click', function() {
          // Close other open accordions within the same section
          faqItems.forEach(el => {
            if (el !== item && el.classList.contains('active')) {
              el.classList.remove('active');
              const otherContent = el.querySelector('.fs-faq-content');
              if (otherContent) {
                otherContent.style.maxHeight = 0;
              }
            }
          });

          // Toggle clicked item
          item.classList.toggle('active');
          if (item.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + 'px';
          } else {
            content.style.maxHeight = 0;
          }
        });
      });
    });

    // Handle window resize - adjust heights of open accordions
    function handleResize() {
      document.querySelectorAll('[id^="fs-"] .fs-faq-item.active .fs-faq-content').forEach(content => {
        content.style.maxHeight = content.scrollHeight + 'px';
      });
    }

    // Debounce resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqSplitImage);
  } else {
    initFaqSplitImage();
  }

  // Reinit hook for dynamic content updates
  if (typeof window !== 'undefined') {
    window.initFaqSplitImage = initFaqSplitImage;
  }
})();

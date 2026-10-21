/**
 * Inline Image Headline - Scroll Reveal Animation
 * Splits text into characters and animates them based on scroll position
 */

(function() {
  'use strict';

  function initInlineHeadline() {
    // Find all inline headline sections
    const sections = document.querySelectorAll('.ih-section-wrapper');
    
    sections.forEach(section => {
      const triggerId = section.querySelector('[id^="ih-trigger-"]')?.id;
      if (!triggerId) return;
      
      const container = document.getElementById(triggerId);
      if (!container) return;

      const textSegments = container.querySelectorAll('.ih-text');
      
      // 1. SPLIT TEXT INTO CHARACTERS
      textSegments.forEach(segment => {
        // Skip if already processed
        if (segment.querySelector('.ih-char')) return;
        
        const text = segment.innerText;
        // Split by character but preserve spaces
        const chars = text.split('').map(char => {
          // If it's a space, strictly preserve it, otherwise wrap in span
          return `<span class="ih-char ih-anim-item">${char}</span>`;
        }).join('');
        segment.innerHTML = chars;
      });

      // 2. GATHER ALL ANIMATABLE ITEMS (Chars + Images) in order
      // Querying by common class ensures they are in DOM order (reading flow)
      const allItems = container.querySelectorAll('.ih-anim-item, .ih-img');
      const totalItems = allItems.length;

      if (totalItems === 0) return;

      // 3. SCROLL LISTENER
      function onScroll() {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how far the section has moved through the viewport
        // Start animating when top enters bottom of screen
        // Finish animating when bottom is near top (or middle) of screen
        
        // Start Delay: 0.75 waits until the text is higher up the screen (approx 25% up)
        const startOffset = windowHeight * 0.75;

        // End Quicker: 0.65 finishes the animation closer to the center of the screen
        const endOffset = windowHeight * 0.7;
        
        const elementTop = rect.top;
        const elementHeight = rect.height;
        
        // Math to map scroll position to 0 - 1 range
        let progress = (windowHeight - elementTop - (windowHeight - startOffset)) / (startOffset - endOffset + elementHeight);
        
        // Clamp between 0 and 1
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        // Determine how many items should be active based on progress
        const activeCount = Math.floor(progress * totalItems);

        allItems.forEach((item, index) => {
          if (index < activeCount) {
            item.classList.add('is-active');
          } else {
            item.classList.remove('is-active');
          }
        });
      }

      // Optimization: Request Animation Frame
      let ticking = false;
      const scrollHandler = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            onScroll();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
      
      // Initial call in case loaded in view
      onScroll();
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInlineHeadline);
  } else {
    initInlineHeadline();
  }

  // Reinit hook for dynamic content updates
  if (typeof window !== 'undefined') {
    window.initInlineHeadline = initInlineHeadline;
  }
})();

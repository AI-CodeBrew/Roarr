(function() {
  'use strict';

  function initBeforeAfter() {
    const containers = document.querySelectorAll('[data-ba-container]');
    
    containers.forEach(container => {
      const over = container.querySelector('[data-ba-over]');
      const divider = container.querySelector('[data-ba-divider]');
      const handle = container.querySelector('[data-ba-handle]');
      
      if (!over || !divider || !handle) return;
      
      let isDragging = false;
      let startX = 0;
      let currentSplit = 50;
      
      // Get initial split from CSS variable or inline style
      function getInitialSplit() {
        const style = window.getComputedStyle(over);
        const splitValue = style.getPropertyValue('--split').trim();
        if (splitValue) {
          // Remove % sign if present
          const numValue = parseFloat(splitValue.replace('%', ''));
          if (!isNaN(numValue)) {
            return numValue;
          }
        }
        // Fallback: try to read from inline style
        const inlineStyle = over.getAttribute('style');
        if (inlineStyle) {
          const match = inlineStyle.match(/--split:\s*([\d.]+)%/);
          if (match) {
            return parseFloat(match[1]);
          }
        }
        return 50;
      }
      
      // Update split position
      function updateSplit(percent) {
        percent = Math.max(0, Math.min(100, percent));
        currentSplit = percent;
        
        // Update CSS variable
        over.style.setProperty('--split', percent + '%');
        
        // Update divider and handle position (no transitions)
        const containerWidth = container.offsetWidth;
        const dividerWidth = parseFloat(window.getComputedStyle(divider).width) || 2;
        const handleSize = parseFloat(window.getComputedStyle(handle).width) || 40;
        
        // Disable transitions for instant movement
        divider.style.transition = 'none';
        handle.style.transition = 'none';
        over.style.transition = 'none';
        
        divider.style.left = `calc(${percent}% - ${dividerWidth}px / 2)`;
        handle.style.left = `calc(${percent}% - ${handleSize}px / 2)`;
      }
      
      // Calculate split from mouse/touch position
      function getSplitFromEvent(e) {
        const rect = container.getBoundingClientRect();
        const x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = (x / rect.width) * 100;
        return percent;
      }
      
      // Mouse events
      function handleStart(e) {
        e.preventDefault();
        isDragging = true;
        startX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        container.classList.add('is-dragging');
        container.style.cursor = 'ew-resize';
        handle.style.cursor = 'ew-resize';
      }
      
      function handleMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const percent = getSplitFromEvent(e);
        updateSplit(percent);
      }
      
      function handleEnd(e) {
        if (!isDragging) return;
        e.preventDefault();
        isDragging = false;
        container.classList.remove('is-dragging');
        container.style.cursor = '';
        handle.style.cursor = 'ew-resize';
      }
      
      // Attach event listeners to handle
      handle.addEventListener('mousedown', handleStart);
      handle.addEventListener('touchstart', handleStart, { passive: false });
      
      // Attach to document for mouse move/end (to handle dragging outside container)
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      
      // Also allow clicking/dragging on the container itself
      container.addEventListener('mousedown', (e) => {
        if (e.target === handle || handle.contains(e.target)) return;
        handleStart(e);
        handleMove(e);
      });
      
      container.addEventListener('touchstart', (e) => {
        if (e.target === handle || handle.contains(e.target)) return;
        handleStart(e);
        handleMove(e);
      }, { passive: false });
      
      // Initialize with default split
      currentSplit = getInitialSplit();
      updateSplit(currentSplit);
      
      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          updateSplit(currentSplit);
        }, 100);
      });
    });
  }
  
  // Expose for dynamic content (e.g. React preview)
  window.initBeforeAfter = initBeforeAfter;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeforeAfter);
  } else {
    initBeforeAfter();
  }
  
  // Also reinitialize when new content is loaded (for dynamic content)
  if (typeof window.Shopify !== 'undefined' && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', initBeforeAfter);
  }
})();


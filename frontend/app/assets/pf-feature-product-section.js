/**
 * Featured Products Slider — horizontal track scroll (prev/next)
 */

(function () {
  'use strict';

  function initFeatureProductSection() {
    document.querySelectorAll('[id^="fp-"]').forEach((section) => {
      const sectionId = section.id.replace(/^fp-/, '');
      const track = document.getElementById(`track-${sectionId}`);
      const prevBtn = section.querySelector('.fp-btn.prev');
      const nextBtn = section.querySelector('.fp-btn.next');

      if (!track || !nextBtn) return;

      const getScrollAmount = () => {
        const card = track.querySelector('.fp-card');
        if (!card) return 0;
        const style = getComputedStyle(track);
        const gap = parseFloat(style.gap) || 0;
        return card.offsetWidth + gap;
      };

      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
      });

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeatureProductSection);
  } else {
    initFeatureProductSection();
  }

  if (typeof window !== 'undefined') {
    window.initFeatureProductSection = initFeatureProductSection;
  }
})();

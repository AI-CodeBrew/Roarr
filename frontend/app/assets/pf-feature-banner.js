/**
 * Feature Card Slider - Infinite loop with prev/next navigation
 */

(function() {
  'use strict';

  function initFeatureBanner() {
    const sections = document.querySelectorAll('[id^="fc-"]');

    sections.forEach(section => {
      const sectionId = section.id.replace('fc-', '');
      const track = document.getElementById(`track-${sectionId}`);
      const prevBtn = section.querySelector('.fc-arrow.prev');
      const nextBtn = section.querySelector('.fc-arrow.next');
      const dots = section.querySelectorAll('.fc-dot');

      if (!track || !nextBtn) return;

      const totalSlides = parseInt(track.dataset.blocksSize || '3', 10);
      const slideGap = parseInt(track.dataset.slideGap || '20', 10);
      let currentIndex = totalSlides;

      const cssPx = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;

      const getStep = () => {
        const card = track.querySelector('.fc-card');
        const gap = window.innerWidth > 768 ? slideGap : 15;
        return card ? card.offsetWidth + gap : 0;
      };

      const getOffset = () => cssPx(track, 'paddingLeft');

      function waitForScrollEnd(timeout = 120) {
        return new Promise(resolve => {
          let timer;
          const onScroll = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              track.removeEventListener('scroll', onScroll);
              resolve();
            }, timeout);
          };
          track.addEventListener('scroll', onScroll);
          onScroll();
        });
      }

      const setupPosition = () => {
        const step = getStep();
        const offset = getOffset();
        if (step === 0) return;
        track.scrollLeft = step * totalSlides - offset;
      };

      const scrollTrack = (index, smooth = true) => {
        const step = getStep();
        const offset = getOffset();
        const left = Math.max(0, Math.round(step * index - offset));
        track.style.scrollBehavior = smooth ? 'smooth' : 'auto';
        track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
      };

      const checkInfiniteLoop = () => {
        const step = getStep();
        const offset = getOffset();
        if (!step) return;

        const minIndex = totalSlides;
        const maxIndex = totalSlides * 2 - 1;

        if (currentIndex > maxIndex) {
          const mirror = currentIndex - totalSlides;
          currentIndex = totalSlides + (mirror % totalSlides);
          track.style.scrollBehavior = 'auto';
          track.scrollTo({ left: Math.round(step * currentIndex - offset), behavior: 'auto' });
          track.style.scrollBehavior = 'smooth';
        } else if (currentIndex < minIndex) {
          const mirror = (currentIndex + totalSlides) % totalSlides;
          currentIndex = totalSlides + mirror;
          track.style.scrollBehavior = 'auto';
          track.scrollTo({ left: Math.round(step * currentIndex - offset), behavior: 'auto' });
          track.style.scrollBehavior = 'smooth';
        }
      };

      window.addEventListener('load', setupPosition);
      window.addEventListener('resize', () => {
        const step = getStep();
        const offset = getOffset();
        track.scrollLeft = step * currentIndex - offset;
      });

      nextBtn.addEventListener('click', async () => {
        currentIndex++;
        scrollTrack(currentIndex, true);
        await waitForScrollEnd(300);
        checkInfiniteLoop();
      });

      if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
          currentIndex--;
          scrollTrack(currentIndex, true);
          await waitForScrollEnd(300);
          checkInfiniteLoop();
        });
      }

      track.addEventListener('scroll', () => {
        const step = getStep();
        if (!step) return;

        const offset = getOffset();
        const rawIndex = Math.round((track.scrollLeft + offset) / step);
        const realIndex = ((rawIndex % totalSlides) + totalSlides) % totalSlides;

        if (window.innerWidth <= 768) {
          dots.forEach(d => d.classList.remove('active'));
          if (dots[realIndex]) dots[realIndex].classList.add('active');
        }
      });

      setupPosition();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeatureBanner);
  } else {
    initFeatureBanner();
  }

  if (typeof window !== 'undefined') {
    window.initFeatureBanner = initFeatureBanner;
  }
})();

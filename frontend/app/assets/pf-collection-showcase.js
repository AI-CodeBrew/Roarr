/**
 * Collection Card Slider — infinite loop track + mobile dots
 */

(function () {
  'use strict';

  function cssPx(el, prop) {
    return parseFloat(getComputedStyle(el)[prop]) || 0;
  }

  function waitForScrollEnd(track, timeout = 120) {
    return new Promise((resolve) => {
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

  function initSection(sectionEl) {
    const track = sectionEl.querySelector('.fc-track');
    const prevBtn = sectionEl.querySelector('.fc-arrow.prev');
    const nextBtn = sectionEl.querySelector('.fc-arrow.next');
    const dots = sectionEl.querySelectorAll('.fc-dot');

    if (!track) return;

    const totalSlides = parseInt(sectionEl.dataset.totalSlides, 10) || 0;
    if (totalSlides === 0) return;

    const gapDesktop = parseFloat(sectionEl.dataset.slideGap) || 20;
    const gapMobile = parseFloat(sectionEl.dataset.mobileSlideGap) || 15;

    let currentIndex = totalSlides;

    const getStep = () => {
      const card = track.querySelector('.fc-card');
      const gap = window.innerWidth > 768 ? gapDesktop : gapMobile;
      return card ? card.offsetWidth + gap : 0;
    };

    const getOffset = () => cssPx(track, 'paddingLeft');

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

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        currentIndex++;
        scrollTrack(currentIndex, true);
        await waitForScrollEnd(track, 300);
        checkInfiniteLoop();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        currentIndex--;
        scrollTrack(currentIndex, true);
        await waitForScrollEnd(track, 300);
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
        dots.forEach((d) => d.classList.remove('active'));
        if (dots[realIndex]) dots[realIndex].classList.add('active');
      }
    });

    window.addEventListener('load', setupPosition);
    window.addEventListener('resize', () => {
      const step = getStep();
      const offset = getOffset();
      track.scrollLeft = Math.round(step * currentIndex - offset);
    });

    setupPosition();
  }

  function initCollectionShowcase() {
    document.querySelectorAll('[id^="fc-"]').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollectionShowcase);
  } else {
    initCollectionShowcase();
  }

  if (typeof window !== 'undefined') {
    window.initCollectionShowcase = initCollectionShowcase;
  }
})();

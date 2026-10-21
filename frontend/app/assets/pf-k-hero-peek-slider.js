/**
 * Hero Peek Slider - Pro Version
 * Handles slide transitions, autoplay, and progress indicators.
 * Auto-initializes all [data-hero-peek-slider] sections on load.
 */

(function () {
  'use strict';

  const sliderInstances = new Map();

  function initHeroPeekSlider(sectionId, autoplaySpeed) {
    const slides = document.querySelectorAll(`#hs-${sectionId} .hs-slide`);
    const dots = document.querySelectorAll(`#hs-${sectionId} .hs-dot`);
    if (!slides.length || !dots.length) return;

    const existingInstance = sliderInstances.get(sectionId);
    if (existingInstance && typeof existingInstance.destroy === 'function') {
      existingInstance.destroy();
    }

    const duration = Number.isFinite(autoplaySpeed) ? autoplaySpeed : 6000;
    let currentIndex = 0;
    let timer = null;

    function updateSlides(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;

      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev', 'next');
        if (i === index) slide.classList.add('active');
        else if (i === (index - 1 + slides.length) % slides.length) slide.classList.add('prev');
        else if (i === (index + 1) % slides.length) slide.classList.add('next');
      });

      dots.forEach((dot, i) => {
        const progress = dot.querySelector('.hs-progress');
        if (i !== index) {
          dot.classList.remove('active', 'filling');
          if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0%';
          }
        }
      });

      const activeDot = dots[index];
      if (activeDot) {
        const progress = activeDot.querySelector('.hs-progress');
        activeDot.classList.add('active');
        if (progress) {
          progress.style.transition = 'none';
          progress.style.width = '0%';
          void progress.offsetWidth;
          setTimeout(() => { activeDot.classList.add('filling'); }, 20);
        }
      }

      clearTimeout(timer);
      if (duration > 0) {
        timer = setTimeout(() => updateSlides(currentIndex + 1), duration);
      }
    }

    sliderInstances.set(sectionId, {
      goToSlide: updateSlides,
      destroy: function () {
        clearTimeout(timer);
      }
    });

    window['hsGoToSlide_' + sectionId] = function (idx) {
      updateSlides(idx);
    };

    updateSlides(0);
  }

  window.hsGoToSlide = function (idx) {
    const activeSlider = document.querySelector('[data-hero-peek-slider]');
    if (activeSlider) {
      const sectionId = activeSlider.getAttribute('data-section-id');
      const instance = sliderInstances.get(sectionId);
      if (instance) instance.goToSlide(idx);
    }
  };

  function autoInit() {
    document.querySelectorAll('[data-hero-peek-slider]').forEach(slider => {
      const sectionId = slider.getAttribute('data-section-id');
      const rawAutoplaySpeed = slider.getAttribute('data-autoplay-speed');
      const autoplaySpeed = Number.parseInt(rawAutoplaySpeed, 10);
      if (sectionId) initHeroPeekSlider(sectionId, autoplaySpeed);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.initHeroPeekSlider = initHeroPeekSlider;

  document.addEventListener('shopify:section:load', function (event) {
    const root = event.target;
    if (!root || typeof root.querySelector !== 'function') return;
    const slider = root.querySelector('[data-hero-peek-slider]');
    if (!slider) return;
    const sectionId = slider.getAttribute('data-section-id');
    const rawAutoplaySpeed = slider.getAttribute('data-autoplay-speed');
    const autoplaySpeed = Number.parseInt(rawAutoplaySpeed, 10);
    if (sectionId) initHeroPeekSlider(sectionId, autoplaySpeed);
  });
})();

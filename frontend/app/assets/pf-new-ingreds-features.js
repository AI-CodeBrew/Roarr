/**
 * Multi-Purpose Image Accordion - Accordion + image sync
 * data-accordion-single-image="true": one creative image (Kluck); no per-tab image swap
 */

(function() {
  'use strict';

  function initImageAccordion() {
    const sections = document.querySelectorAll('.img-acc-section');

    sections.forEach(sectionWrapper => {
      const sectionId = sectionWrapper.id;
      if (!sectionId) return;

      const singleImageMode = sectionWrapper.getAttribute('data-accordion-single-image') === 'true';
      const triggers = sectionWrapper.querySelectorAll('.img-acc-trigger');
      const contents = sectionWrapper.querySelectorAll('.img-acc-content');
      const images = sectionWrapper.querySelectorAll('.img-acc-image');

      if (triggers.length === 0) return;

      if (images.length > 0) {
        const firstImage = images[0];
        if (!firstImage.classList.contains('is-active')) {
          firstImage.classList.add('is-active');
        }
      }

      const setHeight = (element) => {
        if (element) {
          element.style.maxHeight = element.scrollHeight + 'px';
        }
      };

      if (contents.length > 0) {
        const firstContent = contents[0];
        const firstTrigger = triggers[0];
        if (firstTrigger && firstTrigger.classList.contains('is-open')) {
          setHeight(firstContent);
        }
      }

      triggers.forEach((trigger) => {
        trigger.addEventListener('click', function () {
          const index = this.getAttribute('data-index');
          const content = this.nextElementSibling;
          const isOpen = this.classList.contains('is-open');

          if (isOpen) {
            this.classList.remove('is-open');
            if (content) content.style.maxHeight = null;
            if (!singleImageMode) {
              const targetImage = sectionWrapper.querySelector(`.img-acc-image[data-index="${index}"]`);
              if (targetImage) targetImage.classList.add('is-active');
            } else if (images.length > 0) {
              images[0].classList.add('is-active');
            }
            return;
          }

          triggers.forEach((t) => t.classList.remove('is-open'));
          contents.forEach((c) => {
            c.style.maxHeight = null;
          });

          if (!singleImageMode) {
            images.forEach((img) => img.classList.remove('is-active'));
          }

          this.classList.add('is-open');
          setHeight(content);

          if (!singleImageMode) {
            const targetImage = sectionWrapper.querySelector(`.img-acc-image[data-index="${index}"]`);
            if (targetImage) targetImage.classList.add('is-active');
          } else if (images.length > 0) {
            images[0].classList.add('is-active');
          }
        });
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const activeContent = sectionWrapper.querySelector('.img-acc-trigger.is-open + .img-acc-content');
          if (activeContent) {
            setHeight(activeContent);
          }
        }, 250);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageAccordion);
  } else {
    initImageAccordion();
  }

  if (typeof window !== 'undefined') {
    window.initImageAccordion = initImageAccordion;
  }
})();

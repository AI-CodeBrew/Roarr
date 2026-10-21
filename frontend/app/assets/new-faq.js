/**
 * Kluck AI - FAQ Section Accordion
 * Initializes accordion behavior for all .kluck-faq-section blocks on the page.
 */

(function () {
  const initFaq = () => {
    const sections = document.querySelectorAll('.kluck-faq-section:not([data-faq-initialized])');
    sections.forEach((section) => {
      section.setAttribute('data-faq-initialized', 'true');
      const items = section.querySelectorAll('.faq-item');
      items.forEach((item) => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        if (!trigger || !content) return;

        trigger.addEventListener('click', () => {
          const isOpen = item.classList.contains('active');

          // Close others in this section
          items.forEach((i) => {
            i.classList.remove('active');
            const t = i.querySelector('.faq-trigger');
            const c = i.querySelector('.faq-content');
            if (t) t.setAttribute('aria-expanded', 'false');
            if (c) c.style.maxHeight = null;
          });

          if (!isOpen) {
            item.classList.add('active');
            trigger.setAttribute('aria-expanded', 'true');
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      });
    });
  };

  document.addEventListener('DOMContentLoaded', initFaq);

  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initFaq);
  }

  // Expose for liquid preview reinit
  window.initNewFaq = initFaq;
})();

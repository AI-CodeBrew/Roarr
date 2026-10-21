(function() {
  class DeliveryEstimator extends HTMLElement {
    connectedCallback() {
      this.renderDates();
      this.stagger();
      this.initServiceAccordion();
    }
    renderDates() {
      const today = new Date();
      const formatDate = (dt) => {
        const opts = { month: 'short', day: 'numeric' };
        if (dt.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
        return dt.toLocaleDateString('en-US', opts);
      };

      const simpleLine = this.querySelector('.de-fe__simple-line');
      if (simpleLine) {
        const processingDays = parseInt(this.dataset.processingDays || '2', 10);
        const deliveryDaysAfter = parseInt(this.dataset.deliveryDaysAfter || '3', 10);
        const todayDate = new Date(today);
        const processingDate = new Date(today);
        processingDate.setDate(today.getDate() + processingDays);
        const deliveredDate = new Date(today);
        deliveredDate.setDate(today.getDate() + processingDays + deliveryDaysAfter);
        const todayEl = simpleLine.querySelector('[data-date-today]');
        const processingEl = simpleLine.querySelector('[data-date-processing]');
        const deliveredEl = simpleLine.querySelector('[data-date-delivered]');
        if (todayEl) todayEl.textContent = formatDate(todayDate);
        if (processingEl) processingEl.textContent = formatDate(processingDate);
        if (deliveredEl) deliveredEl.textContent = formatDate(deliveredDate);
        return;
      }

      const steps = this.querySelectorAll('.de-fe__step');
      steps.forEach(step => {
        const days = parseInt(step.dataset.days || '0', 10);
        const dt = new Date(today);
        dt.setDate(today.getDate() + days);
        const el = step.querySelector('[data-date-target]');
        if (el) el.textContent = formatDate(dt);
      });
    }
    stagger() {
      const wraps = this.querySelectorAll('.de-fe__iconWrap');
      wraps.forEach((w, i) => {
        w.style.animationDelay = (i * 0.18) + 's';
      });
    }

    initServiceAccordion() {
      const accordion = this.querySelector('[data-service-accordion]');
      if (!accordion) return;

      const toggles = accordion.querySelectorAll('[data-service-toggle]');
      const contents = accordion.querySelectorAll('[data-service-content]');

      toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
          const target = toggle.dataset.serviceToggle;
          const targetContent = accordion.querySelector('[data-service-content="' + target + '"]');
          const isOpen = targetContent && targetContent.classList.contains('active');

          contents.forEach((content) => content.classList.remove('active'));
          toggles.forEach((btn) => {
            btn.setAttribute('aria-expanded', 'false');
            btn.classList.remove('is-active');
          });

          if (!isOpen && targetContent) {
            targetContent.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.classList.add('is-active');
          }
        });
      });
    }
  }

  // Initialize on DOM ready
  function initializeAll() {
    const estimators = document.querySelectorAll('[class*="de-fe"]');
    estimators.forEach(function(estimator) {
      const tagName = estimator.tagName.toLowerCase();
      if (tagName.startsWith('delivery-estimator-')) {
        // Define the custom element with the specific tag name if not already defined
        if (!customElements.get(tagName)) {
          customElements.define(tagName, DeliveryEstimator);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
  } else {
    initializeAll();
  }
})();


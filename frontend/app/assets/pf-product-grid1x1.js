/**
 * Tabbed Product Grid — tab switching
 */

(function () {
  'use strict';

  function initProductGrid1x1() {
    document.querySelectorAll('[id^="tpg-"]').forEach((root) => {
      if (root.dataset.tpgInitialized === 'true') return;
      root.dataset.tpgInitialized = 'true';

      const tabs = root.querySelectorAll('.tpg-tab-btn');
      const panels = root.querySelectorAll('.tpg-grid-panel');

      tabs.forEach((tab) => {
        tab.addEventListener('click', function () {
          tabs.forEach((t) => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          panels.forEach((p) => p.classList.remove('active'));

          this.classList.add('active');
          this.setAttribute('aria-selected', 'true');

          const targetId = this.getAttribute('data-target');
          const target = targetId ? document.getElementById(targetId) : null;
          if (target) target.classList.add('active');
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductGrid1x1);
  } else {
    initProductGrid1x1();
  }

  if (typeof window !== 'undefined') {
    window.initProductGrid1x1 = initProductGrid1x1;
  }
})();

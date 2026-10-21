/**
 * About Us tabbed section — tab / panel switching
 */
(function () {
  "use strict";

  function initModernTabs() {
    document.querySelectorAll('[id^="ModernTabSection-"]').forEach(function (section) {
      if (section.dataset.pfAboutTabsInit) return;
      section.dataset.pfAboutTabsInit = "1";

      var tabs = section.querySelectorAll(".modern-tabs__btn");
      var panels = section.querySelectorAll(".modern-tabs__panel");
      if (!tabs.length || !panels.length) return;

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) {
            t.classList.remove("is-active");
            t.setAttribute("aria-selected", "false");
          });
          panels.forEach(function (p) {
            p.classList.remove("is-active");
          });

          tab.classList.add("is-active");
          tab.setAttribute("aria-selected", "true");

          var targetId = tab.getAttribute("data-target");
          if (!targetId) return;
          var targetPanel = section.querySelector("#" + targetId);
          if (targetPanel) {
            targetPanel.classList.add("is-active");
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModernTabs);
  } else {
    initModernTabs();
  }
})();

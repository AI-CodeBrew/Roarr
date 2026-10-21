/**
 * About Us rich text — IntersectionObserver scroll reveal for .modern-rich-text--animated
 */
(function () {
  "use strict";

  function initAboutRichTextRoots() {
    var roots = document.querySelectorAll(
      '[id^="ModernRichText-"] .modern-rich-text-root.modern-rich-text--animated'
    );
    if (!roots.length) return;

    var options = {
      root: null,
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px"
    };

    roots.forEach(function (target) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      }, options);
      observer.observe(target);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutRichTextRoots);
  } else {
    initAboutRichTextRoots();
  }
})();

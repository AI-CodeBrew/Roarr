/**
 * Minimal FAQ - Accordion functionality
 * Handles expand/collapse, auto-close, and resize
 */

(function () {
  "use strict";

  function initMinimalFaq() {
    const sections = document.querySelectorAll('[id^="FaqSection-"]');
    sections.forEach((section) => {
      if (section.dataset.pfFaqInitialized) return;
      section.dataset.pfFaqInitialized = "1";

      const autoClose = section.getAttribute("data-auto-close") === "true";
      const faqItems = section.querySelectorAll(".minimal-faq__item");

      function setInitialHeights() {
        faqItems.forEach((item) => {
          if (item.classList.contains("is-open")) {
            const wrapper = item.querySelector(".minimal-faq__answer-wrapper");
            const inner = item.querySelector(".minimal-faq__answer-inner");
            if (wrapper && inner) wrapper.style.maxHeight = inner.scrollHeight + "px";
          }
        });
      }

      setInitialHeights();

      faqItems.forEach((item) => {
        const button = item.querySelector(".minimal-faq__question");
        const wrapper = item.querySelector(".minimal-faq__answer-wrapper");
        const inner = item.querySelector(".minimal-faq__answer-inner");
        if (!button || !wrapper || !inner) return;

        button.addEventListener("click", () => {
          const isOpen = item.classList.contains("is-open");

          if (autoClose && !isOpen) {
            faqItems.forEach((otherItem) => {
              if (otherItem !== item && otherItem.classList.contains("is-open")) {
                otherItem.classList.remove("is-open");
                const ow = otherItem.querySelector(".minimal-faq__answer-wrapper");
                const ob = otherItem.querySelector(".minimal-faq__question");
                if (ow) ow.style.maxHeight = "0px";
                if (ob) ob.setAttribute("aria-expanded", "false");
              }
            });
          }

          if (isOpen) {
            item.classList.remove("is-open");
            wrapper.style.maxHeight = "0px";
            button.setAttribute("aria-expanded", "false");
          } else {
            item.classList.add("is-open");
            wrapper.style.maxHeight = inner.scrollHeight + "px";
            button.setAttribute("aria-expanded", "true");
          }
        });
      });

      const resizeHandler = () => {
        faqItems.forEach((item) => {
          if (item.classList.contains("is-open")) {
            const wrapper = item.querySelector(".minimal-faq__answer-wrapper");
            const inner = item.querySelector(".minimal-faq__answer-inner");
            if (wrapper && inner) wrapper.style.maxHeight = inner.scrollHeight + "px";
          }
        });
      };

      window.addEventListener("resize", resizeHandler);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMinimalFaq);
  } else {
    initMinimalFaq();
  }
})();

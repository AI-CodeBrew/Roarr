import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Plain CSS rather than utilities: the arrows must stay centred whatever global button styles the
// embedded admin applies. The "more" arrow nudges and pulses three times, then settles.
const RAIL_CSS = `
  .tcr-arrow { position: absolute; top: 50%; z-index: 10; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; border: 0; border-radius: 9999px; line-height: 0; color: #fff; background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); box-shadow: 0 0 0 3px #fff, 0 10px 26px rgba(30, 64, 175, .38); cursor: pointer; transform: translateY(-50%); transition: filter .2s ease, box-shadow .2s ease; }
  .tcr-arrow svg { display: block; flex: none; }
  .tcr-arrow:hover { filter: brightness(1.1); box-shadow: 0 0 0 3px #fff, 0 14px 32px rgba(124, 58, 237, .48); }
  .tcr-arrow:focus-visible { outline: 2px solid #1e3a8a; outline-offset: 4px; }
  .tcr-arrow--prev { left: 10px; }
  .tcr-arrow--next { right: 10px; animation: tcr-nudge 2.2s ease-in-out .6s 3; }
  .tcr-arrow--next::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: inherit; animation: tcr-ping 2.2s cubic-bezier(0, 0, .2, 1) .6s 3; opacity: 0; }
  @keyframes tcr-nudge { 0%, 60%, 100% { transform: translate(0, -50%); } 72% { transform: translate(6px, -50%); } 84% { transform: translate(0, -50%); } 92% { transform: translate(3px, -50%); } }
  @keyframes tcr-ping { 0% { transform: scale(1); opacity: .5; } 75%, 100% { transform: scale(1.75); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .tcr-arrow--next, .tcr-arrow--next::before { animation: none; } }
`;

/**
 * Horizontal row of template cards: `visible` cards fit at once, the rest scroll left / right
 * (swipe, trackpad or the arrow buttons). Keeps the card at `activeIndex` in view.
 */
export default function TemplateCardRail({ children, visible = 3, gap = 12, activeIndex = -1, label = "Templates" }) {
  const railRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const items = Children.toArray(children);
  const cardWidth = `calc((100% - ${gap * (visible - 1)}px) / ${visible})`;

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({ start: rail.scrollLeft > 4, end: rail.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    updateEdges();
    rail.addEventListener("scroll", updateEdges, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
    observer?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", updateEdges);
      observer?.disconnect();
    };
  }, [updateEdges, items.length]);

  // Bring the selected card into view (e.g. a saved page that uses a template beyond the first three).
  useEffect(() => {
    const rail = railRef.current;
    const card = rail?.children[activeIndex];
    if (!rail || !card) return;
    const left = card.offsetLeft - rail.offsetLeft;
    if (left < rail.scrollLeft || left + card.offsetWidth > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeIndex]);

  const scrollByCard = (direction) => {
    const rail = railRef.current;
    const card = rail?.children[0];
    if (!rail || !card) return;
    rail.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <style>{RAIL_CSS}</style>
      <div
        ref={railRef}
        role="list"
        aria-label={label}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: `${gap}px` }}
      >
        {items.map((child, index) => (
          <div key={child.key ?? index} role="listitem" className="grid flex-none snap-start" style={{ width: cardWidth }}>
            {child}
          </div>
        ))}
      </div>
      {edges.start ? (
        <button type="button" aria-label="Previous templates" onClick={() => scrollByCard(-1)} className="tcr-arrow tcr-arrow--prev">
          <ChevronLeft size={22} strokeWidth={2.6} aria-hidden />
        </button>
      ) : null}
      {edges.end ? (
        <button type="button" aria-label="More templates" onClick={() => scrollByCard(1)} className="tcr-arrow tcr-arrow--next">
          <ChevronRight size={22} strokeWidth={2.6} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Numbered FAQ drawers in the Roarr style: white cards, a blue index badge, a chevron tile that
 * fills blue when open, and an answer that eases open (line breaks in answers are kept).
 * @param {{ id: string, question: import('react').ReactNode, answer: import('react').ReactNode }[]} items
 * @param {{ maxWidth?: string }} [layout]
 */
export function FaqAccordionList({ items, layout: { maxWidth = "860px" } = {} }) {
  const [openId, setOpenId] = useState(null);

  const toggle = useCallback((id) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  return (
    <ul className="m-0 mx-auto flex w-full list-none flex-col gap-3 p-0" style={{ maxWidth }}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        const panelId = `faq-panel-${item.id}`;
        return (
          <li
            key={item.id}
            className={`rounded-2xl bg-white transition duration-200 ${
              isOpen
                ? "shadow-[0_14px_30px_-20px_rgba(30,58,138,0.55)] ring-2 ring-[#1e40af]/25"
                : "shadow-sm ring-1 ring-slate-200/70 hover:ring-blue-200"
            }`}
          >
            <button
              type="button"
              id={`faq-button-${item.id}`}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] sm:px-5"
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-bold tabular-nums transition ${
                  isOpen ? "bg-[#1e3a8a] text-white" : "bg-blue-50 text-[#1e40af]"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug text-slate-900">
                {item.question}
              </span>
              <span
                aria-hidden
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full transition duration-200 ${
                  isOpen ? "rotate-180 bg-[#1e3a8a] text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                <ChevronDown size={16} />
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={`faq-button-${item.id}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="whitespace-pre-line break-words px-4 pb-5 pl-[62px] pr-5 text-sm leading-relaxed text-slate-600 sm:pl-[70px]">
                  {item.answer}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

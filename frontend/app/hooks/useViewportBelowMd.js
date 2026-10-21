import { useEffect, useState } from "react";

/** Matches Tailwind `md:` (768px): true when viewport is narrower than `md`. */
export function useViewportBelowMd() {
  const [belowMd, setBelowMd] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setBelowMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return belowMd;
}

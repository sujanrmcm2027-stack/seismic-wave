import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-18 left-4 sm:bottom-20 sm:left-5 z-[55] w-10 h-10 rounded-full bg-surface-2/95 backdrop-blur-md border border-border shadow-lg grid place-items-center text-foreground hover:bg-surface active:scale-95 transition-all touch-manipulation"
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

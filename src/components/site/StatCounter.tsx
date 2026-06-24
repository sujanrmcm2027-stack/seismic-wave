import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
};

export function StatCounter({ value, suffix = "", prefix = "", decimals = 0, duration = 1400 }: Props) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(value * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [value, duration]);

  const formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

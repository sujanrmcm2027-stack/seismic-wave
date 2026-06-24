import { AlertTriangle, Radio } from "lucide-react";

const alerts = [
  "ADVISORY · Minor tremor M3.2 recorded near Lamjung, 14 km depth — no damage reported",
  "DRILL · Nationwide earthquake preparedness drill scheduled Jan 16, 11:00 NPT",
  "UPDATE · NDRRMA seismic monitoring network: 84 stations operational",
  "GUIDANCE · Review Drop · Cover · Hold On procedures with your household this week",
];

export function AlertBanner() {
  return (
    <div className="relative bg-destructive text-destructive-foreground border-b border-destructive/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] tracking-[0.2em] font-semibold uppercase">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          Live Advisory
        </div>
        <div className="hidden sm:block h-4 w-px bg-destructive-foreground/30 shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <div className="flex gap-12 whitespace-nowrap animate-marquee text-xs font-medium">
            {[...alerts, ...alerts].map((a, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <Radio className="w-3 h-3 opacity-70" />
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

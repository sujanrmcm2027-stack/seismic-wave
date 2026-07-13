import { useState } from "react";
import { Phone, ChevronDown, ChevronUp, X } from "lucide-react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";

type Contact = {
  name: string;
  nameNe: string;
  number: string;
  color: string; // tailwind bg class
};

const CONTACTS: Contact[] = [
  { name: "Police",        nameNe: "प्रहरी",          number: "100",  color: "bg-blue-600" },
  { name: "Fire Brigade",  nameNe: "दमकल",           number: "101",  color: "bg-orange-600" },
  { name: "Ambulance",     nameNe: "एम्बुलेन्स",      number: "102",  color: "bg-red-600" },
  { name: "Natl Emergency",nameNe: "राष्ट्रिय आपत्",  number: "1149", color: "bg-red-700" },
  { name: "NDRRMA",        nameNe: "NDRRMA",          number: "01-4200178", color: "bg-purple-700" },
  { name: "Red Cross",     nameNe: "रेड क्रस",        number: "01-4270650", color: "bg-red-500" },
  { name: "DHM Flood",     nameNe: "बाढी हेल्पलाइन", number: "1155", color: "bg-cyan-700" },
  { name: "Electricity",   nameNe: "विद्युत",         number: "1150", color: "bg-yellow-600" },
];

export function EmergencyContactsBar() {
  const { lang } = useCrisisMode();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-5 right-5 z-[65] bg-red-600 text-white rounded-full px-5 py-3 shadow-xl font-mono text-sm font-bold tracking-wider flex items-center gap-2 hover:bg-red-700 transition-colors pulse-ring"
        aria-label="Show emergency contacts"
      >
        <Phone className="w-4 h-4" />
        SOS
      </button>
    );
  }

  return (
    <>
      {/* ── DESKTOP: Right floating panel ───────────────────────────────── */}
      <div className="hidden lg:flex fixed right-5 bottom-5 z-[65] flex-col items-end gap-1">
        <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden w-52">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 bg-red-600 text-white">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                {t("contacts.title", lang)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-0.5 hover:bg-white/20 rounded transition"
                aria-label="Toggle contact list"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-0.5 hover:bg-white/20 rounded transition"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Contacts list */}
          <div className={`transition-all duration-300 ${expanded ? "max-h-0 overflow-hidden" : "max-h-[500px]"}`}>
            {CONTACTS.map((c) => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className="flex items-center justify-between px-3 py-2 border-b border-border/60 last:border-0 hover:bg-surface transition-colors group"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-foreground truncate">
                    {lang === "ne" ? c.nameNe : c.name}
                  </div>
                  <div className="font-mono text-sm font-bold text-primary group-hover:text-primary/80">
                    {c.number}
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center shrink-0`}>
                  <Phone className="w-3.5 h-3.5 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── MOBILE: Bottom sticky bar ────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[65] bg-card border-t-2 border-red-600 shadow-2xl">
        {/* Collapsed: show 4 quick-dial tiles */}
        {!expanded && (
          <div className="grid grid-cols-4 divide-x divide-border">
            {CONTACTS.slice(0, 3).map((c) => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className="flex flex-col items-center justify-center py-2 px-1 hover:bg-surface active:bg-surface/80 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center mb-1`}>
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div className="font-mono text-[9px] font-bold text-foreground">
                  {c.number}
                </div>
                <div className="text-[8px] text-muted-foreground truncate max-w-full px-0.5">
                  {lang === "ne" ? c.nameNe : c.name}
                </div>
              </a>
            ))}
            {/* Expand button as 4th cell */}
            <button
              onClick={() => setExpanded(true)}
              className="flex flex-col items-center justify-center py-2 px-1 hover:bg-surface transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mb-1">
                <ChevronUp className="w-4 h-4 text-white" />
              </div>
              <div className="font-mono text-[9px] font-bold text-red-600">ALL</div>
              <div className="text-[8px] text-muted-foreground">Contacts</div>
            </button>
          </div>
        )}

        {/* Expanded: full contacts grid */}
        {expanded && (
          <div>
            <div className="flex items-center justify-between px-4 py-2 bg-red-600 text-white">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                  {t("contacts.title", lang)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded hover:bg-white/20 transition"
                  aria-label="Collapse contacts"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 rounded hover:bg-white/20 transition"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border max-h-60 overflow-y-auto">
              {CONTACTS.map((c) => (
                <a
                  key={c.number}
                  href={`tel:${c.number}`}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-surface active:bg-surface/80 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center shrink-0`}>
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-base font-bold text-foreground leading-none">
                      {c.number}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {lang === "ne" ? c.nameNe : c.name}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

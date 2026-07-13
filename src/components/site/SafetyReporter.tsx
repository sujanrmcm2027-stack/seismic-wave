import { useState, useEffect } from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { syncSafetyReport, fetchPublicCounts } from "@/services/dataService";


type Report = "safe" | "help" | null;

export function SafetyReporter() {
  const { lang } = useCrisisMode();
  const [safeCount, setSafeCount] = useState(0);
  const [helpCount, setHelpCount] = useState(0);
  const [myReport, setMyReport] = useState<Report>(null);
  const [modalType, setModalType] = useState<Report>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  
  const [userId] = useState(() => {
    let id = localStorage.getItem('status_user_id');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('status_user_id', id);
    }
    return id;
  });

  // Fetch live counts on mount and every 60s
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const counts = await fetchPublicCounts();
      if (!cancelled && counts) {
        setSafeCount(counts.safeCount);
        setHelpCount(counts.helpCount);
      }
    }
    void load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!modalType || !name) return;

    const type = modalType;

    // Optimistically update local state
    if (myReport === "safe") setSafeCount((c) => Math.max(0, c - 1));
    if (myReport === "help") setHelpCount((c) => Math.max(0, c - 1));

    if (type === "safe") setSafeCount((c) => c + 1);
    if (type === "help") setHelpCount((c) => c + 1);

    setMyReport(type);

    // Send to backend via cloud sync
    void syncSafetyReport({ userId, status: type, name, location, note });

    // Save to Safety Board (localStorage)
    const report = {
      id: Date.now().toString(),
      name,
      location,
      note,
      status: type,
      timestamp: Date.now()
    };
    const existing = JSON.parse(localStorage.getItem("safety_board_reports") || "[]");
    localStorage.setItem("safety_board_reports", JSON.stringify([...existing, report]));
    window.dispatchEvent(new Event("safety_board_updated"));

    setModalType(null);
    setName("");
    setLocation("");
    setNote("");
  }

  return (
    <section
      aria-label="Community safety status reporter"
      className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-surface/60 border-b border-border px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
            {t("reporter.title", lang)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("reporter.subtitle", lang)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-0">
        {/* I AM SAFE */}
        <button
          onClick={() => setModalType("safe")}
          aria-pressed={myReport === "safe"}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 border-r border-border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            myReport === "safe"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          <CheckCircle2 className={`w-10 h-10 ${myReport === "safe" ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
          <div className="text-center">
            <div className="font-bold text-lg tracking-wide leading-tight">
              {t("reporter.safe", lang)}
            </div>
            <div className="text-xs opacity-70 mt-0.5">
              {t("reporter.safe_sub", lang)}
            </div>
          </div>
          {myReport === "safe" && (
            <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">✓ Reported</span>
          )}
        </button>

        {/* NEED ASSISTANCE */}
        <button
          onClick={() => setModalType("help")}
          aria-pressed={myReport === "help"}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            myReport === "help"
              ? "bg-red-600 text-white"
              : "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          <AlertTriangle className={`w-10 h-10 ${myReport === "help" ? "text-white" : "text-red-600 dark:text-red-400"}`} />
          <div className="text-center">
            <div className="font-bold text-lg tracking-wide leading-tight">
              {t("reporter.help", lang)}
            </div>
            <div className="text-xs opacity-70 mt-0.5">
              {t("reporter.help_sub", lang)}
            </div>
          </div>
          {myReport === "help" && (
            <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">✓ Reported</span>
          )}
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 border-t border-border">
        <div className="flex flex-col items-center py-3 px-4 border-r border-border">
          <div className="font-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {safeCount}
          </div>
          <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {t("reporter.safe_count", lang)}
          </div>
        </div>
        <div className="flex flex-col items-center py-3 px-4">
          <div className="font-serif text-3xl font-bold text-red-600 dark:text-red-400">
            {helpCount}
          </div>
          <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {t("reporter.help_count", lang)}
          </div>
        </div>
      </div>

      {/* Feedback message */}
      {myReport && (
        <div
          className={`px-5 py-3 text-xs font-medium border-t border-border ${
            myReport === "safe"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
          }`}
        >
          {myReport === "safe" ? t("reporter.thankyou_safe", lang) : t("reporter.thankyou_help", lang)}
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 py-2.5 bg-surface/40 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-mono text-center">
          ⚠ {t("reporter.note", lang)}
        </p>
      </div>
      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
            <div className={`p-4 border-b border-border flex justify-between items-center ${
              modalType === "safe" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
            }`}>
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                {modalType === "safe" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {modalType === "safe" ? "Check In as Safe" : "Request Assistance"}
              </div>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-black/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitReport} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Current Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="e.g. Tudikhel Open Ground" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status Note (Optional)</label>
                <input 
                  type="text" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="e.g. I am safe with my family." 
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2.5 rounded-md font-bold text-white transition-colors ${
                  modalType === "safe" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Submit Report to Safety Board
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

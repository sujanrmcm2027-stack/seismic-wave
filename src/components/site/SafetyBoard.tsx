import { useState, useEffect } from "react";
import { Search, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export type SafetyBoardReport = {
  id: string;
  name: string;
  location: string;
  note: string;
  status: "safe" | "help";
  timestamp: number;
};

export function SafetyBoard() {
  const [reports, setReports] = useState<SafetyBoardReport[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadReports = () => {
      const data = JSON.parse(localStorage.getItem("safety_board_reports") || "[]");
      // Sort newest first
      setReports(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    };
    loadReports();
    window.addEventListener("safety_board_updated", loadReports);
    return () => window.removeEventListener("safety_board_updated", loadReports);
  }, []);

  const filtered = reports.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-4">
      <div className="bg-surface/60 border-b border-border px-5 py-3">
        <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
          Public Safety Board
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Search for family and friends who have checked in.
        </p>
      </div>
      
      <div className="p-4 border-b border-border bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {search ? "No reports found matching that name." : "No reports yet. Be the first to check in!"}
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="p-4 hover:bg-surface/50 transition-colors flex justify-between items-start gap-4">
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Location: {r.location || "Unknown"}</div>
                {r.note && <div className="text-sm mt-1.5 italic text-foreground/90">"{r.note}"</div>}
              </div>
              <div className="flex flex-col items-end shrink-0 gap-1">
                <div className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                  r.status === "safe" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {r.status === "safe" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {r.status.toUpperCase()}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

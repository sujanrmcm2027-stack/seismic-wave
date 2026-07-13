import { useState } from "react";
import { MapPin, Navigation, Send } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { syncDyfiReport } from "@/services/dataService";


export type Intensity = "Not felt" | "Weak" | "Moderate" | "Strong";

export type DYFIReport = {
  id: string;
  intensity: Intensity;
  lat: number;
  lng: number;
  accuracy: number;          // GPS accuracy radius in metres
  timestamp: number;         // Unix ms
  timestampNpt: string;      // Human-readable Nepal time
  source: "gps" | "approx"; // How location was determined
};

export function DidYouFeelIt() {
  const [intensity, setIntensity] = useState<Intensity | "">("");
  const { position, status: geoStatus } = useGeolocation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intensity) return;

    // Dedup guard: prevent double-submitting within 5 minutes
    const existing = JSON.parse(localStorage.getItem("dyfi_reports") || "[]") as DYFIReport[];
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (existing.some((r) => r.timestamp > fiveMinutesAgo)) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      return;
    }

    const isGps = geoStatus === "success" && !!position;
    const lat = isGps ? position!.lat : 27.7172 + (Math.random() - 0.5) * 0.1;
    const lng = isGps ? position!.lng : 85.324 + (Math.random() - 0.5) * 0.1;
    const accuracy = isGps ? (position!.accuracy ?? 0) : 5000;

    const timestampNpt = new Intl.DateTimeFormat("en-NP", {
      timeZone: "Asia/Kathmandu",
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date());

    const report: DYFIReport = {
      id: Date.now().toString(),
      intensity,
      lat,
      lng,
      accuracy,
      timestamp: Date.now(),
      timestampNpt,
      source: isGps ? "gps" : "approx",
    };

    // Send to backend
    void syncDyfiReport({ intensity, lat, lng, accuracy, source: isGps ? "gps" : "approx", timestampNpt });

    // Keep a 30-day rolling window of DYFI reports
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = existing.filter((r: DYFIReport) => r.timestamp > thirtyDaysAgo);
    localStorage.setItem("dyfi_reports", JSON.stringify([...filtered, report]));
    
    // Dispatch a custom event so the map can re-render immediately
    window.dispatchEvent(new Event("dyfi_updated"));
    
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Did You Feel It?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Help map the earthquake intensity by sharing what you felt. No registration required.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-lg bg-emerald-500/10 p-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Thank you! Your report has been added to the live map.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Shake Intensity</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["Not felt", "Weak", "Moderate", "Strong"] as Intensity[]).map((level) => (
                <label
                  key={level}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors ${
                    intensity === level
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-surface/50 text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="intensity"
                    value={level}
                    className="sr-only"
                    onChange={(e) => setIntensity(e.target.value as Intensity)}
                  />
                  <span className="text-xs font-semibold">{level}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {level === "Weak" && "Rattling dishes"}
                    {level === "Moderate" && "Hard to stand"}
                    {level === "Strong" && "Objects falling"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Location</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm">
              {geoStatus === "success" ? (
                <>
                  <Navigation className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Using accurate GPS location</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Approximate location will be used</span>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!intensity}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Submit Report
          </button>
        </form>
      )}
    </div>
  );
}

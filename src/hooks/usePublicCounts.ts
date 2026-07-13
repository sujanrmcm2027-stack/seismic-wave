/**
 * usePublicCounts — fetches and auto-refreshes the portal-wide participant
 * counts from Google Sheets every 60 seconds. Merges with localStorage-based
 * local counts so the display is always non-zero even while the remote fetch
 * is in flight.
 */
import { useEffect, useState } from "react";
import { fetchPublicCounts, type PublicCounts } from "@/services/dataService";


const REFRESH_MS = 60_000; // re-fetch every minute

function localCounts(): Partial<PublicCounts> {
  try {
    const safety = JSON.parse(localStorage.getItem("safety_board_reports") || "[]");
    const dyfi   = JSON.parse(localStorage.getItem("dyfi_reports")          || "[]");
    const chat   = JSON.parse(localStorage.getItem("chat_history")           || "[]");
    const eq     = JSON.parse(localStorage.getItem("eq_history")             || "[]");
    const safeCount = safety.filter((r: any) => r.status === "safe").length;
    const helpCount = safety.filter((r: any) => r.status === "help").length;
    return {
      safeCount,
      helpCount,
      dyfiCount  : dyfi.length,
      chatCount  : Math.floor(chat.length / 2), // pairs of user+assistant
      eqLogCount : eq.length,
    };
  } catch {
    return {};
  }
}

export function usePublicCounts() {
  const [counts, setCounts] = useState<PublicCounts>(() => ({
    safeCount   : 0,
    helpCount   : 0,
    dyfiCount   : 0,
    chatCount   : 0,
    eqLogCount  : 0,
    lastUpdated : null,
    ...localCounts(),
  }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const remote = await fetchPublicCounts();
      if (cancelled) return;
      if (remote) {
        // Merge: take the max of remote vs local for each counter so the
        // display never decreases if the remote lags a refresh cycle.
        const local = localCounts();
        setCounts({
          safeCount  : Math.max(remote.safeCount,   local.safeCount   ?? 0),
          helpCount  : Math.max(remote.helpCount,   local.helpCount   ?? 0),
          dyfiCount  : Math.max(remote.dyfiCount,   local.dyfiCount   ?? 0),
          chatCount  : Math.max(remote.chatCount,   local.chatCount   ?? 0),
          eqLogCount : Math.max(remote.eqLogCount,  local.eqLogCount  ?? 0),
          lastUpdated: remote.lastUpdated,
        });
      } else {
        // Remote unavailable — show local-only counts
        setCounts((prev) => ({ ...prev, ...localCounts() }));
      }
      setLoading(false);
    }

    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return { counts, loading };
}

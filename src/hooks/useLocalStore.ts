/**
 * useLocalStore — thin localStorage hook with deduplication, size cap,
 * and cross-tab sync via the "storage" event.
 *
 * Usage:
 *   const [items, push, clear] = useLocalStore<MyType>("my_key", 500);
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Storable = { id: string; [key: string]: unknown };

function readStore<T extends Storable>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function writeStore<T extends Storable>(key: string, items: T[], maxItems: number) {
  // Keep newest maxItems entries (they're sorted newest-first)
  const trimmed = items.slice(0, maxItems);
  try {
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // If storage is full, drop the oldest half and try again
    const smaller = items.slice(0, Math.floor(maxItems / 2));
    try {
      localStorage.setItem(key, JSON.stringify(smaller));
    } catch {
      // Give up silently — storage may be full
    }
  }
  return trimmed;
}

export function useLocalStore<T extends Storable>(
  key: string,
  maxItems = 200,
): [T[], (item: T) => void, () => void] {
  const [items, setItems] = useState<T[]>(() => readStore<T>(key));
  const keyRef = useRef(key);

  // Stay in sync across tabs / components via the native "storage" event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === keyRef.current) {
        setItems(readStore<T>(keyRef.current));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const push = useCallback(
    (item: T) => {
      setItems((prev) => {
        // Dedup by id — if already present, bring it to the top
        const withoutDup = prev.filter((p) => p.id !== item.id);
        const next = [item, ...withoutDup];
        return writeStore(keyRef.current, next, maxItems);
      });
    },
    [maxItems],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(keyRef.current);
    setItems([]);
  }, []);

  return [items, push, clear];
}

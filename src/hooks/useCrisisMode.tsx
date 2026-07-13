import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ne";

type CrisisModeContextType = {
  liteMode: boolean;
  toggleLiteMode: () => void;
  lang: Lang;
  toggleLang: () => void;
};

const CrisisModeContext = createContext<CrisisModeContextType>({
  liteMode: false,
  toggleLiteMode: () => {},
  lang: "en",
  toggleLang: () => {},
});

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function CrisisModeProvider({ children }: { children: ReactNode }) {
  const [liteMode, setLiteMode] = useState(
    () => readStorage("crisis-lite", "false") === "true",
  );
  const [lang, setLang] = useState<Lang>(
    () => (readStorage("crisis-lang", "en") as Lang),
  );

  useEffect(() => writeStorage("crisis-lite", String(liteMode)), [liteMode]);
  useEffect(() => writeStorage("crisis-lang", lang), [lang]);

  const toggleLiteMode = useCallback(() => setLiteMode((v) => !v), []);
  const toggleLang = useCallback(
    () => setLang((l) => (l === "en" ? "ne" : "en")),
    [],
  );

  return (
    <CrisisModeContext.Provider value={{ liteMode, toggleLiteMode, lang, toggleLang }}>
      {children}
    </CrisisModeContext.Provider>
  );
}

export function useCrisisMode() {
  return useContext(CrisisModeContext);
}

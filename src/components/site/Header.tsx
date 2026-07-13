import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { searchIndex } from "@/data/searchIndex";

const nav = [
  { to: "/", label: "Home" },
  { to: "/historical", label: "Historical" },
  { to: "/gis", label: "GIS" },
  { to: "/damage-assessment", label: "Damage" },
  { to: "/safe-zones", label: "Safe Zones" },
  { to: "/preparedness", label: "Preparedness" },
  { to: "/test-yourself", label: "Self-Assessment" },
  { to: "/about", label: "About" },
] as const;

function HeaderSearch({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchIndex(query), [query]);
  const isDesktop = variant === "desktop";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(to: string) {
    setQuery("");
    setIsOpen(false);
    navigate({ to });
    onNavigate?.();
  }

  return (
    <div ref={containerRef} className={`relative ${isDesktop ? "w-44 xl:w-52" : "mb-2 md:hidden"}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border/60 focus-within:border-primary/60 transition-colors">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              e.currentTarget.blur();
            } else if (e.key === "Enter" && results[0]) {
              handleSelect(results[0].to);
            }
          }}
          placeholder="Search…"
          aria-label="Search the portal"
          className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
        />
      </div>
      {isOpen && query.trim() && (
        <div
          className={`z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden ${
            isDesktop ? "absolute left-0 right-0 top-full mt-2" : "mt-2"
          }`}
        >
          {results.length ? (
            <ul className="divide-y divide-border max-h-72 overflow-y-auto">
              {results.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    onClick={() => handleSelect(r.to)}
                    className="block px-3 py-2.5 hover:bg-surface transition-colors"
                  >
                    <div className="text-sm font-medium text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {r.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No pages match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-4">

        {/* ── LOGO ─────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Waves className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="block font-bold text-foreground text-sm tracking-tight">
              Nepal Seismic
            </span>
            <span className="block font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase mt-0.5">
              Disaster Portal
            </span>
          </div>
        </Link>

        {/* ── NAV (desktop) ─────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-surface"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* ── RIGHT CONTROLS (desktop) ──────────────────── */}
        <div className="hidden md:flex items-center gap-2 ml-auto lg:ml-0">
          <HeaderSearch variant="desktop" />
          <div className="w-px h-4 bg-border" />
          <ThemeToggle />
        </div>

        {/* ── MOBILE CONTROLS ───────────────────────────── */}
        <div className="flex items-center gap-1 lg:hidden ml-auto">
          <ThemeToggle />
          <button
            className="p-1.5 text-foreground rounded-md hover:bg-surface transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ───────────────────────────────────── */}
      {open && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <nav className="px-4 py-3 flex flex-col gap-0.5">
            <HeaderSearch variant="mobile" onNavigate={() => setOpen(false)} />
            <div className="h-2" />
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

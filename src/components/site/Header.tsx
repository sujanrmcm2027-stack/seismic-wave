import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { searchIndex } from "@/data/searchIndex";
import logo from "@/assets/logo.jpeg";

const nav = [
  { to: "/", label: "Home" },
  { to: "/historical", label: "Historical Events" },
  { to: "/gis", label: "GIS" },
  { to: "/damage-assessment", label: "Damage Assessment" },
  { to: "/safe-zones", label: "Safe Zones" },
  { to: "/preparedness", label: "Preparedness" },
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-10 z-40 backdrop-blur-md bg-background/85 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-4">

          {/* ── LOGO ─────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img
              src={logo}
              alt="Nepal Seismic Disaster Portal logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0"
            />
            <div className="leading-tight">
              <span className="block font-bold text-foreground text-sm tracking-tight sm:hidden">
                Nepal Seismic
              </span>
              <span className="hidden sm:block font-bold text-foreground text-sm tracking-tight">
                Nepal Seismic Disaster Portal
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

          {/* ── DESKTOP CONTROLS (lg: >= 1024px) ─────────────── */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <HeaderSearch variant="desktop" />
            <div className="w-px h-4 bg-border" />
            <ThemeToggle />
          </div>

          {/* ── MOBILE & TABLET CONTROLS (< 1024px) ─────────── */}
          <div className="flex items-center gap-1.5 lg:hidden ml-auto">
            <ThemeToggle />
            <button
              className="p-2 text-foreground rounded-lg hover:bg-surface border border-transparent active:border-border transition-colors touch-manipulation"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── FLOATING MOBILE HAMBURGER BUTTON (Accessible anywhere, even at bottom of page) ── */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lg:hidden fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full bg-card/95 border border-border/80 shadow-2xl backdrop-blur-md px-3.5 py-2.5 text-foreground font-semibold text-xs hover:bg-surface active:scale-95 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-2"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
      >
        {open ? (
          <X className="w-4 h-4 text-primary" />
        ) : (
          <Menu className="w-4 h-4 text-primary" />
        )}
        <span className="font-mono tracking-wide">{open ? "CLOSE" : "MENU"}</span>
      </button>

      {/* ── MOBILE & TABLET DRAWER MODAL (Accessible from anywhere on the page) ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[75] flex flex-col justify-end sm:justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative w-full max-h-[85dvh] bg-card border-t sm:border border-border/80 shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden max-w-lg mx-auto"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/70 shrink-0">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <img src={logo} alt="Nepal Seismic" className="w-7 h-7 rounded-md object-cover shadow-xs" />
                <div className="leading-tight">
                  <span className="block font-bold text-foreground text-sm">Nepal Seismic</span>
                  <span className="block text-[10px] text-muted-foreground font-mono">Disaster Portal</span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-transparent active:border-border transition-colors touch-manipulation"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-2.5 border-b border-border/50 bg-surface/30 shrink-0">
              <HeaderSearch variant="mobile" onNavigate={() => setOpen(false)} />
            </div>

            {/* Nav items */}
            <nav className="overflow-y-auto px-3 py-2 flex flex-col gap-1">
              {nav.map((n) => {
                const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/15 text-primary font-semibold shadow-xs"
                        : "text-foreground/80 hover:text-foreground hover:bg-surface active:bg-surface-2"
                    }`}
                  >
                    <span>{n.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>

            {/* Quick SOS strip */}
            <div className="p-3 border-t border-border/50 bg-surface/40 shrink-0">
              <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase px-2 mb-2 font-semibold">
                Emergency Numbers
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:100"
                  className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold"
                >
                  Police 100
                </a>
                <a
                  href="tel:102"
                  className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-md bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold"
                >
                  Ambulance 102
                </a>
                <a
                  href="tel:101"
                  className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-md bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold"
                >
                  Fire 101
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Search, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";


const nav = [
  { to: "/", label: "Home" },
  { to: "/historical", label: "Historical" },
  { to: "/preparedness", label: "Preparedness" },
  { to: "/test-yourself", label: "Self-Assessment" },
  { to: "/about", label: "About" },
] as const;

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/90 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4 md:gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <span className="w-9 h-9 rounded-md bg-primary grid place-items-center shadow-sm shrink-0">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="leading-tight min-w-0">
            <span className="block font-serif font-bold text-foreground text-sm truncate">Nepal Seismic</span>
            <span className="hidden sm:block font-mono text-[9px] tracking-[0.18em] text-muted-foreground uppercase">National Disaster Portal</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-foreground/75 hover:text-foreground hover:bg-surface"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-2 ml-auto lg:ml-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-2 border border-border w-48 xl:w-56">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search topics..."
              className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
            />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-1 lg:hidden ml-auto">
          <ThemeToggle />
          <button
            className="p-2 text-foreground rounded-md hover:bg-surface"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-up">
          <nav className="px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 border border-border mb-2 md:hidden">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search topics..." className="bg-transparent outline-none text-sm flex-1" />
            </div>
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium ${active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-2"}`}
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


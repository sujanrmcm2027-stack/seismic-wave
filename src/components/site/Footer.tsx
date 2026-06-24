import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

const contacts = [
  ["Nepal Police", "100"],
  ["Fire Brigade", "101"],
  ["Ambulance", "102"],
  ["National Emergency", "1149"],
  ["NDRRMA", "01-4200178"],
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-md bg-primary grid place-items-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="font-serif font-bold text-foreground">Nepal Seismic Portal</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A national-level resource for earthquake awareness, preparedness, and resilience in Nepal.
          </p>
        </div>
        <div className="md:col-span-3">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">PAGES</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/historical" className="hover:text-primary">Historical Earthquakes</Link></li>
            <li><Link to="/preparedness" className="hover:text-primary">Preparedness</Link></li>
            <li><Link to="/test-yourself" className="hover:text-primary">Test Yourself</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">EMERGENCY CONTACTS</div>
          <ul className="space-y-2 text-sm">
            {contacts.map(([n, v]) => (
              <li key={n} className="flex items-center justify-between gap-4">
                <span className="text-foreground/80">{n}</span>
                <span className="font-mono text-primary">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <p>© 2026 Nepal Seismic Awareness Portal. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Accessibility Statement</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

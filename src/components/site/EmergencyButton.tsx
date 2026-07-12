import { Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

export const EMERGENCY_CONTACTS = [
  ["Nepal Police", "100"],
  ["Fire Brigade", "101"],
  ["Ambulance", "102"],
  ["National Emergency", "1149"],
  ["DEOC (MoHA)", "1234"],
  ["NDRRMA", "01-4200178"],
  ["Red Cross Nepal", "01-4270650"],
];

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-md bg-destructive text-destructive-foreground font-semibold shadow-lg pulse-ring hover:opacity-95"
      >
        <Phone className="w-4 h-4" />
        Emergency
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-foreground">Emergency Contacts</h3>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <ul className="divide-y divide-border">
              {EMERGENCY_CONTACTS.map(([n, v]) => (
                <li key={n} className="flex items-center justify-between py-3">
                  <span className="text-foreground/90">{n}</span>
                  <a href={`tel:${v}`} className="font-mono text-primary hover:underline">{v}</a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">If you or someone near you is in immediate danger, call 100 or 1149.</p>
          </div>
        </div>
      )}
    </>
  );
}

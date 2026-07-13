import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { AlertBanner } from "./AlertBanner";
import { ChatWidget } from "./ChatWidget";
import { CrisisBar } from "./CrisisBar";
import { EmergencyContactsBar } from "./EmergencyContactsBar";
import { CrisisModeProvider } from "@/hooks/useCrisisMode";
import { ParticipantTrustBar } from "./ParticipantTrustBar";

function LayoutInner({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-topo" aria-hidden="true" />
      {/* Crisis bar — very top, sticky, always visible */}
      <div className="print:hidden"><CrisisBar /></div>
      {/* Static advisory banner — below crisis bar */}
      <div className="print:hidden"><AlertBanner /></div>
      <div className="print:hidden"><Header /></div>
      {/* Live participant trust bar — shows community activity counts */}
      <div className="print:hidden"><ParticipantTrustBar /></div>
      <main className="flex-1">{children}</main>
      <div className="print:hidden"><Footer /></div>
      {/* Floating overlays */}
      <div className="print:hidden"><EmergencyContactsBar /></div>
      <div className="print:hidden"><BackToTop /></div>
      <div className="print:hidden"><ChatWidget /></div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <CrisisModeProvider>
      <LayoutInner>{children}</LayoutInner>
    </CrisisModeProvider>
  );
}

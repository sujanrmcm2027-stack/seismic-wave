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
      <CrisisBar />
      {/* Static advisory banner — below crisis bar */}
      <AlertBanner />
      <Header />
      {/* Live participant trust bar — shows community activity counts */}
      <ParticipantTrustBar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Floating overlays */}
      <EmergencyContactsBar />
      <BackToTop />
      <ChatWidget />
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

import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { EmergencyButton } from "./EmergencyButton";
import { BackToTop } from "./BackToTop";
import { AlertBanner } from "./AlertBanner";
import { ChatWidget } from "./ChatWidget";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-topo" aria-hidden="true" />
      <AlertBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <EmergencyButton />
      <BackToTop />
      <ChatWidget />
    </div>
  );
}


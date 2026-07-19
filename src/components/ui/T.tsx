import React from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";

export function T({ en, ne }: { en: React.ReactNode; ne?: React.ReactNode }) {
  const { lang } = useCrisisMode();
  if (lang === "ne" && ne) return <>{ne}</>;
  return <>{en}</>;
}

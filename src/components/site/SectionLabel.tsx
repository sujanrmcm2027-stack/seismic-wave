export function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="font-mono text-primary text-sm">{number}.</span>
      <span className="h-px w-12 bg-border" />
      <span className="font-mono text-xs tracking-[0.25em] text-muted-foreground">{label}</span>
    </div>
  );
}

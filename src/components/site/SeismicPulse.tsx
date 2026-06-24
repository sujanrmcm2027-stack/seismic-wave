export function SeismicPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="seismic-bar inline-block w-0.5 bg-current rounded-full"
          style={{ height: "100%", animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

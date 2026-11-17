export function GalleryFallback({ progress, message }: { progress?: number; message?: string }) {
  const value = progress == null ? null : Math.round(progress);
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center" role="status">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Olalekan Isiaka</p>
      <p className="font-serif text-3xl sm:text-5xl">Anticipate Hues that Heal 2.0</p>
      <p className="text-muted">{message ?? (value == null ? "Opening the visual studio" : `Loading the visual studio, ${value}%`)}</p>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-24 rounded-full bg-white/5" />
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="h-4 w-80 rounded bg-white/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-80 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

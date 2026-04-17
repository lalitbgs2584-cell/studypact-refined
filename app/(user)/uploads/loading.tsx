export default function UploadsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-20 rounded-full bg-white/5" />
        <div className="h-8 w-36 rounded-lg bg-white/5" />
        <div className="h-4 w-64 rounded bg-white/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

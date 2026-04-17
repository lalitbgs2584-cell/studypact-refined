export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-48 rounded-xl bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="h-72 rounded-xl bg-white/5" />
        <div className="h-72 rounded-xl bg-white/5" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

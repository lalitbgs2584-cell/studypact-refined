export default function TasksLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-5 w-16 rounded-full bg-white/5" />
          <div className="h-8 w-32 rounded-lg bg-white/5" />
          <div className="h-4 w-80 rounded bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-white/5" />
          <div className="h-8 w-20 rounded-lg bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="h-80 rounded-xl bg-white/5" />
        <div className="h-80 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

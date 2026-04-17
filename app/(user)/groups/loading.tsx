export default function GroupsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-44 rounded-xl bg-white/5" />
        <div className="h-44 rounded-xl bg-white/5" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
      </div>
      <div className="h-72 rounded-xl bg-white/5" />
    </div>
  );
}

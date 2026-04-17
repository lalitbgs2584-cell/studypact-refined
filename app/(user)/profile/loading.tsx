export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-white/5" />
        <div className="space-y-3">
          <div className="h-6 w-40 rounded-lg bg-white/5" />
          <div className="h-4 w-56 rounded bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 rounded-xl bg-white/5" />
        <div className="h-48 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-24 rounded-full bg-white/5" />
        <div className="h-8 w-44 rounded-lg bg-white/5" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

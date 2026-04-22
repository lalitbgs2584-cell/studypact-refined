export const dynamic = "force-dynamic";

import Link from "next/link";
import { ReflectionUnderstanding } from "@prisma/client";
import { startOfWeek } from "date-fns";
import {
  BookCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { BlockProgressCard } from "@/components/block-progress-card";
import { TrackerScoreRing } from "@/components/tracker-score-ring";
import { TrackerTaskCard } from "@/components/tracker-task-card";
import { FocusLog } from "@/components/focus-log";
import { GenerateWeeklyReportButton } from "@/components/generate-weekly-report-button";
import { ReflectionUnderstandingControl } from "@/components/reflection-understanding-control";
import { TrackerErrorAlert } from "@/components/tracker-error-alert";
import { getFocusLog } from "@/lib/sidebar-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveDailyReflection } from "@/lib/actions/reflection";
import { getTrackerOverview } from "@/lib/tracker";
import { getWorkspace, requireSession } from "@/lib/workspace";

function trendIcon(trend: string) {
  if (trend === "IMPROVING") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === "DECLINING") return <TrendingDown className="h-3.5 w-3.5 text-red-300" />;
  return <Target className="h-3.5 w-3.5 text-primary" />;
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const { activeGroupId, activeGroup } = await getWorkspace(session.user.id);

  if (!activeGroupId) {
    return (
      <div className="mx-auto max-w-4xl min-h-0 space-y-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tracker
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Join a group to activate your tracker</h1>
            <p className="text-white/60">
              The tracker needs a group context so it can calculate personal progress, group accountability, and weekly reports.
            </p>
            <Link href="/groups">
              <Button>Go to groups</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [overview, focusTasks] = await Promise.all([
    getTrackerOverview(session.user.id, activeGroupId),
    getFocusLog(session.user.id, activeGroupId),
  ]);
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const hasCurrentWeekReport = overview.recentReports.some(
    (report) => report.weekStart.getTime() === currentWeekStart.getTime(),
  );

  return (
    <div className="mx-auto max-w-7xl min-h-0 space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="space-y-5 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tracker Arena
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                {overview.summary.userName}&apos;s consistency loop
              </h1>
              <p className="max-w-2xl text-white/60">
                Personal and group work in {activeGroup?.name ?? overview.summary.groupName} now roll into one habit system: finish tasks, protect streaks, reflect at night, and build a compounding score.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/tasks">
                <Button className="gap-2">
                  <Target className="h-4 w-4" />
                  Add today&apos;s tasks
                </Button>
              </Link>
              <Link href="/proof-work">
                <Button variant="outline">Submit proof</Button>
              </Link>
            </div>
            {params.error ? (
              <TrackerErrorAlert message={decodeURIComponent(params.error)} />
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TrackerScoreRing
            score={overview.summary.consistencyScore}
            label="Consistency score"
            helper="Completion rate + streak continuity + difficulty weighting"
            streak={overview.summary.dailyStreak}
          />
          <TrackerScoreRing
            score={overview.summary.weeklyConsistency}
            label="Weekly score"
            helper={`${overview.summary.weeklyCompletionRate}% of this week's tasks are complete`}
          />
          <TrackerScoreRing
            score={Math.min(100, overview.summary.bestStreak * 10)}
            label="Best streak"
            helper="Longest streak you've held so far in this group."
            displayValue={overview.summary.bestStreak}
            valueCaption={overview.summary.bestStreak === 1 ? "day" : "days"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overview.blocks.map((block) => (
          <BlockProgressCard
            key={block.blockType}
            label={block.label}
            shortLabel={block.shortLabel}
            description={block.description}
            percent={block.percent}
            completed={block.completed}
            total={block.total}
            accent={block.accent}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <FocusLog tasks={focusTasks} />

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">This Week&apos;s Completion Bars</CardTitle>
            <CardDescription className="text-white/45">
              Daily completion bars make momentum visible before your streak breaks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.weekBars.map((bar) => (
              <div key={bar.date.toISOString()} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>{bar.label}</span>
                  <span>
                    {bar.completed}/{bar.total || 0}
                  </span>
                </div>
                <div className="progress-track overflow-hidden">
                  <div className="progress-fill" style={{ width: `${bar.percent}%` }} />
                </div>
              </div>
            ))}

            <div className="rounded-[10px] border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-white/60">
              Formula: 60% completion rate, 25% streak continuity, 15% difficulty lift, and a late penalty capped at 10 points.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Personal Tracker</CardTitle>
            <CardDescription className="text-white/45">
              Recurring personal habits roll up by task name, not by isolated checkboxes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.personalEntries.length === 0 ? (
              <div className="rounded-[8px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                No personal tracker streams yet. Create a task to start building one.
              </div>
            ) : (
              overview.personalEntries.map((entry) => <TrackerTaskCard key={entry.id} {...entry} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Group Tracker</CardTitle>
            <CardDescription className="text-white/45">
              Group tasks show whether you kept your promise to the cohort, not just your solo plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.groupEntries.length === 0 ? (
              <div className="rounded-[8px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                No active group tracker streams yet. Broadcast or receive a group task to populate this view.
              </div>
            ) : (
              overview.groupEntries.map((entry) => <TrackerTaskCard key={entry.id} {...entry} />)
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-white">Night Reflection</CardTitle>
            <CardDescription className="text-white/45">
              Close the day with one understanding check and one concrete promise for tomorrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={saveDailyReflection} className="space-y-4">
              <input type="hidden" name="groupId" value={activeGroupId} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="understanding">How well did you understand today&apos;s work?</Label>
                  <ReflectionUnderstandingControl
                    defaultValue={
                      (overview.reflection?.understanding ??
                        ReflectionUnderstanding.PARTIALLY_UNDERSTOOD) as
                        | "UNDERSTOOD"
                        | "PARTIALLY_UNDERSTOOD"
                        | "NOT_UNDERSTOOD"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tomorrowPlan">What will you implement tomorrow?</Label>
                  <Input
                    id="tomorrowPlan"
                    name="tomorrowPlan"
                    defaultValue={overview.reflection?.tomorrowPlan ?? ""}
                    placeholder="Ship the binary search revision sheet and finish the auth bug"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reflection-note">Short note</Label>
                <Textarea
                  id="reflection-note"
                  name="note"
                  defaultValue={overview.reflection?.note ?? ""}
                  placeholder="What slowed you down? What should you repeat?"
                  className="min-h-[110px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-primary/10 bg-primary/5 p-4">
                <div>
                  <div className="text-sm font-semibold text-white">Reflection snapshot</div>
                  <div className="text-xs text-white/45">
                    Tonight&apos;s reflection stores your understanding signal, tomorrow plan, and an AI-style summary linked to your tracker data.
                  </div>
                </div>
                <Button type="submit">Save reflection</Button>
              </div>
            </form>

            {overview.reflection?.aiSummary ? (
              <div className="rounded-[10px] border border-primary/15 bg-primary/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
                  <BookCheck className="h-3.5 w-3.5" />
                  Daily summary
                </div>
                <div className="text-sm text-white/75">{overview.reflection.aiSummary}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Weekly Reports</CardTitle>
            <CardDescription className="text-white/45">
              Strong areas, weak areas, and trend direction for the last few weeks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 rounded-[10px] border border-primary/10 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Manual weekly generation</div>
                <div className="text-xs text-white/45">
                  No cron required. Generate the current week&apos;s summary when you want a fresh report.
                </div>
              </div>
              <GenerateWeeklyReportButton groupId={activeGroupId} disabled={hasCurrentWeekReport} />
            </div>

            {overview.recentReports.length === 0 ? (
              <div className="rounded-[8px] bg-secondary/30 p-6 text-center text-sm text-white/45">
                Your first weekly report will appear after enough tracker data exists for a full week.
              </div>
            ) : (
              overview.recentReports.map((report) => {
                const strongAreas = Array.isArray(report.strongAreas)
                  ? (report.strongAreas as Array<{ label: string; percent: number }>)
                  : [];
                const weakAreas = Array.isArray(report.weakAreas)
                  ? (report.weakAreas as Array<{ label: string; percent: number }>)
                  : [];

                return (
                  <div key={report.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {report.weekStart.toLocaleDateString()} - {report.weekEnd.toLocaleDateString()}
                        </div>
                        <div className="mt-1 text-xs text-white/45">{report.summary}</div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-3 py-1 text-xs font-bold text-white/75">
                        {trendIcon(report.trend)}
                        {report.trend.toLowerCase()}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Completed</div>
                        <div className="mt-1 text-lg font-black text-white">{report.completedTasks}</div>
                      </div>
                      <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Score</div>
                        <div className="mt-1 text-lg font-black text-primary">{report.consistencyScore}</div>
                      </div>
                      <div className="rounded-[10px] border border-white/5 bg-white/2 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Completion %</div>
                        <div className="mt-1 text-lg font-black text-white">{report.completionRate}%</div>
                      </div>
                    </div>

                    {strongAreas.length > 0 || weakAreas.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {strongAreas.map((area) => (
                          <span
                            key={`strong-${area.label}`}
                            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400"
                          >
                            ✓ {area.label} {area.percent}%
                          </span>
                        ))}
                        {weakAreas.map((area) => (
                          <span
                            key={`weak-${area.label}`}
                            className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400"
                          >
                            ↓ {area.label} {area.percent}%
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">How The Engine Scores You</CardTitle>
          <CardDescription className="text-white/45">
            The tracker is strict enough to keep you honest, but forgiving enough to keep you in motion.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Completion", value: "60%", note: "Most of the score comes from finishing what you planned." },
            { label: "Streak", value: "25%", note: "Consecutive days of delivery create momentum and improve your score." },
            { label: "Difficulty", value: "15%", note: "Hard tasks add more upside so meaningful work feels rewarding." },
            { label: "Late penalty", value: "-10", note: "Late completions still count, but they reduce the final score." },
          ].map((item) => (
            <div key={item.label} className="glass-card p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-white/35">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-primary">{item.value}</div>
              <div className="mt-2 text-sm text-white/55">{item.note}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

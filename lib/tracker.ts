import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ReflectionUnderstanding,
  StudyBlock,
  TaskDifficulty,
  TaskScope,
  TaskStatus,
  TrackerLogStatus,
  WeeklyTrend,
} from "@prisma/client";

import { db } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

type TaskWithTrackerContext = Prisma.TaskGetPayload<{
  include: {
    checkIn: {
      select: {
        createdAt: true;
        status: true;
      };
    };
  };
}>;

type TrackerLogWithEntry = Prisma.TrackerDailyLogGetPayload<{
  include: {
    trackerEntry: {
      select: {
        id: true;
        title: true;
        scope: true;
        blockType: true;
        difficulty: true;
      };
    };
  };
}>;

type DayStatus = {
  day: Date;
  status: TrackerLogStatus;
};

type ConsistencyBreakdown = {
  completionRate: number;
  streakFactor: number;
  weightedDifficultyRate: number;
  lateRate: number;
  engagementFactor: number;
  score: number;
};

type ReflectionPayload = {
  userId: string;
  groupId: string;
  understanding: ReflectionUnderstanding;
  tomorrowPlan: string;
  note?: string | null;
};

export const STUDY_BLOCK_META: Record<
  StudyBlock,
  { label: string; shortLabel: string; description: string; accent: "green" | "yellow" | "red" }
> = {
  DEEP_WORK: {
    label: "Deep Work",
    shortLabel: "DSA",
    description: "Algorithm drills, problem solving, and uninterrupted focus work.",
    accent: "green",
  },
  LEARNING: {
    label: "Learning",
    shortLabel: "Learn",
    description: "Aptitude, communication, theory, and interview concepts.",
    accent: "yellow",
  },
  PROJECTS: {
    label: "Projects",
    shortLabel: "Build",
    description: "Projects, shipping, portfolio polish, and implementation reps.",
    accent: "red",
  },
};

const DIFFICULTY_WEIGHT: Record<TaskDifficulty, number> = {
  EASY: 1,
  MEDIUM: 1.15,
  HARD: 1.35,
};

const SUCCESS_STATUSES = new Set<TrackerLogStatus>([
  TrackerLogStatus.COMPLETED,
  TrackerLogStatus.LATE,
]);

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function getDueBoundary(task: Pick<TaskWithTrackerContext, "dueAt" | "day">) {
  return task.dueAt ? new Date(task.dueAt) : endOfDay(task.day);
}

function isSuccess(status: TrackerLogStatus) {
  return SUCCESS_STATUSES.has(status);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getHeatLevel(completed: number, total: number) {
  if (total === 0) return 0;
  const ratio = completed / total;
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function toDayKey(date: Date) {
  return format(startOfDay(date), "yyyy-MM-dd");
}

function pickDailyStatus(statuses: TrackerLogStatus[]) {
  if (statuses.some((status) => status === TrackerLogStatus.MISSED)) {
    return TrackerLogStatus.MISSED;
  }

  if (statuses.some((status) => status === TrackerLogStatus.LATE)) {
    return TrackerLogStatus.LATE;
  }

  if (statuses.some((status) => status === TrackerLogStatus.COMPLETED)) {
    return TrackerLogStatus.COMPLETED;
  }

  return TrackerLogStatus.PENDING;
}

function collapseLogsByDay(logs: Array<Pick<TrackerLogWithEntry, "day" | "status">>) {
  const byDay = new Map<string, TrackerLogStatus[]>();

  for (const log of logs) {
    const key = toDayKey(log.day);
    const bucket = byDay.get(key) ?? [];
    bucket.push(log.status);
    byDay.set(key, bucket);
  }

  return Array.from(byDay.entries())
    .map(([key, statuses]) => ({
      day: new Date(`${key}T00:00:00.000Z`),
      status: pickDailyStatus(statuses),
    }))
    .sort((a, b) => a.day.getTime() - b.day.getTime());
}

function calculateRollingStreaks(days: DayStatus[]) {
  let best = 0;
  let running = 0;

  for (const day of days) {
    if (isSuccess(day.status)) {
      running += 1;
      best = Math.max(best, running);
      continue;
    }

    if (day.status === TrackerLogStatus.MISSED) {
      running = 0;
    }
  }

  let current = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];

    if (day.status === TrackerLogStatus.PENDING) {
      continue;
    }

    if (isSuccess(day.status)) {
      current += 1;
      continue;
    }

    break;
  }

  return { current, best };
}

function calculateCalendarStreaks(days: DayStatus[]) {
  if (days.length === 0) {
    return { current: 0, best: 0 };
  }

  let best = 0;
  let running = 0;
  let previousDay: Date | null = null;

  for (const day of days) {
    if (!isSuccess(day.status)) {
      running = 0;
      previousDay = day.day;
      continue;
    }

    if (!previousDay) {
      running = 1;
    } else {
      const gap = differenceInCalendarDays(day.day, previousDay);
      running = gap === 1 ? running + 1 : 1;
    }

    best = Math.max(best, running);
    previousDay = day.day;
  }

  let current = 0;
  let anchor: Date | null = null;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];

    if (day.status === TrackerLogStatus.PENDING) {
      continue;
    }

    if (!isSuccess(day.status)) {
      break;
    }

    if (!anchor) {
      current = 1;
      anchor = day.day;
      continue;
    }

    if (differenceInCalendarDays(anchor, day.day) === 1) {
      current += 1;
      anchor = day.day;
      continue;
    }

    break;
  }

  return { current, best };
}

function calculateConsistencyScore(input: {
  completed: number;
  late: number;
  missed: number;
  total: number;
  currentStreak: number;
  weightedCompleted: number;
  weightedPossible: number;
}): ConsistencyBreakdown {
  if (input.total === 0) {
    return {
      completionRate: 0,
      streakFactor: 0,
      weightedDifficultyRate: 0,
      lateRate: 0,
      engagementFactor: 0,
      score: 0,
    };
  }

  const completionRate = (input.completed + input.late * 0.7) / input.total;
  const streakFactor = clamp(input.currentStreak / 7, 0, 1);
  const weightedDifficultyRate =
    input.weightedPossible > 0 ? input.weightedCompleted / input.weightedPossible : 0;
  const lateRate = input.late / input.total;
  const engagementFactor = clamp(input.total / 5, 0, 1);
  const score = Math.round(
    clamp(
      completionRate * 60 +
        streakFactor * 25 * engagementFactor +
        weightedDifficultyRate * 15 -
        lateRate * 10,
      0,
      100,
    ),
  );

  return {
    completionRate,
    streakFactor,
    weightedDifficultyRate,
    lateRate,
    engagementFactor,
    score,
  };
}

async function fetchTaskForTracker(client: DbClient, taskId: string) {
  return client.task.findUnique({
    where: { id: taskId },
    include: {
      checkIn: {
        select: {
          createdAt: true,
          status: true,
        },
      },
    },
  });
}

function buildLogStatus(task: TaskWithTrackerContext): {
  status: TrackerLogStatus;
  completionAt: Date | null;
  dueAt: Date;
  isLate: boolean;
} {
  const dueAt = getDueBoundary(task);

  if (task.status === TaskStatus.COMPLETED) {
    const completionAt = task.completedAt ?? task.checkIn?.createdAt ?? new Date();
    const isLate = completionAt.getTime() > dueAt.getTime();

    return {
      status: isLate ? TrackerLogStatus.LATE : TrackerLogStatus.COMPLETED,
      completionAt,
      dueAt,
      isLate,
    };
  }

  if (task.status === TaskStatus.MISSED) {
    return {
      status: TrackerLogStatus.MISSED,
      completionAt: null,
      dueAt,
      isLate: false,
    };
  }

  return {
    status: TrackerLogStatus.PENDING,
    completionAt: null,
    dueAt,
    isLate: false,
  };
}

async function recomputeTrackerEntry(client: DbClient, trackerEntryId: string) {
  const trackerEntry = await client.trackerEntry.findUnique({
    where: { id: trackerEntryId },
    include: {
      logs: {
        orderBy: { day: "asc" },
      },
    },
  });

  if (!trackerEntry) {
    return null;
  }

  const dailyStatuses = collapseLogsByDay(trackerEntry.logs);
  const { current, best } = calculateRollingStreaks(dailyStatuses);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyLogs = trackerEntry.logs.filter((log) => log.day >= weekStart);
  const completed = trackerEntry.logs.filter((log) => log.status === TrackerLogStatus.COMPLETED).length;
  const late = trackerEntry.logs.filter((log) => log.status === TrackerLogStatus.LATE).length;
  const missed = trackerEntry.logs.filter((log) => log.status === TrackerLogStatus.MISSED).length;
  const weightedPossible = trackerEntry.logs.length * DIFFICULTY_WEIGHT[trackerEntry.difficulty];
  const weightedCompleted = (completed + late * 0.8) * DIFFICULTY_WEIGHT[trackerEntry.difficulty];
  const consistency = calculateConsistencyScore({
    completed,
    late,
    missed,
    total: trackerEntry.logs.length,
    currentStreak: current,
    weightedCompleted,
    weightedPossible,
  });

  const latestLog = trackerEntry.logs[trackerEntry.logs.length - 1] ?? null;
  const weeklyProgress =
    weeklyLogs.length === 0
      ? 0
      : Math.round(
          (weeklyLogs.filter((log) => isSuccess(log.status)).length / weeklyLogs.length) * 100,
        );

  return client.trackerEntry.update({
    where: { id: trackerEntryId },
    data: {
      streakCount: current,
      bestStreak: best,
      weeklyProgress,
      consistencyScore: consistency.score,
      totalCompletions: completed,
      totalMisses: missed,
      lateCompletions: late,
      status: latestLog?.status ?? TrackerLogStatus.PENDING,
      lastCompletedOn: latestLog?.status && isSuccess(latestLog.status) ? latestLog.day : trackerEntry.lastCompletedOn,
      lastMissedOn: latestLog?.status === TrackerLogStatus.MISSED ? latestLog.day : trackerEntry.lastMissedOn,
      lastLoggedOn: latestLog?.day ?? trackerEntry.lastLoggedOn,
    },
  });
}

async function recomputeUserGroupTrackerStats(client: DbClient, userId: string, groupId: string) {
  const logs = await client.trackerDailyLog.findMany({
    where: { userId, groupId },
    include: {
      trackerEntry: {
        select: {
          difficulty: true,
        },
      },
    },
    orderBy: { day: "asc" },
  });

  const dayStatuses = collapseLogsByDay(logs);
  const { current, best } = calculateCalendarStreaks(dayStatuses);
  const completed = logs.filter((log) => log.status === TrackerLogStatus.COMPLETED).length;
  const late = logs.filter((log) => log.status === TrackerLogStatus.LATE).length;
  const missed = logs.filter((log) => log.status === TrackerLogStatus.MISSED).length;
  const weightedPossible = logs.reduce(
    (sum, log) => sum + DIFFICULTY_WEIGHT[log.trackerEntry.difficulty],
    0,
  );
  const weightedCompleted = logs.reduce((sum, log) => {
    const weight = DIFFICULTY_WEIGHT[log.trackerEntry.difficulty];
    if (log.status === TrackerLogStatus.COMPLETED) return sum + weight;
    if (log.status === TrackerLogStatus.LATE) return sum + weight * 0.8;
    return sum;
  }, 0);

  const consistency = calculateConsistencyScore({
    completed,
    late,
    missed,
    total: logs.length,
    currentStreak: current,
    weightedCompleted,
    weightedPossible,
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyLogs = logs.filter((log) => log.day >= weekStart);
  const weeklyCompleted = weeklyLogs.filter((log) => log.status === TrackerLogStatus.COMPLETED).length;
  const weeklyLate = weeklyLogs.filter((log) => log.status === TrackerLogStatus.LATE).length;
  const weeklyMissed = weeklyLogs.filter((log) => log.status === TrackerLogStatus.MISSED).length;
  const weeklyWeightedPossible = weeklyLogs.reduce(
    (sum, log) => sum + DIFFICULTY_WEIGHT[log.trackerEntry.difficulty],
    0,
  );
  const weeklyWeightedCompleted = weeklyLogs.reduce((sum, log) => {
    const weight = DIFFICULTY_WEIGHT[log.trackerEntry.difficulty];
    if (log.status === TrackerLogStatus.COMPLETED) return sum + weight;
    if (log.status === TrackerLogStatus.LATE) return sum + weight * 0.8;
    return sum;
  }, 0);

  const weeklyConsistency = calculateConsistencyScore({
    completed: weeklyCompleted,
    late: weeklyLate,
    missed: weeklyMissed,
    total: weeklyLogs.length,
    currentStreak: current,
    weightedCompleted: weeklyWeightedCompleted,
    weightedPossible: weeklyWeightedPossible,
  }).score;

  const lastSuccessfulLog = [...logs]
    .reverse()
    .find((log) => isSuccess(log.status));

  await client.userGroup.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: {
      streak: current,
      bestStreak: best,
      completions: completed + late,
      misses: missed,
      consistencyScore: consistency.score,
      weeklyConsistency,
      lastCheckInAt: lastSuccessfulLog?.completionAt ?? lastSuccessfulLog?.day ?? null,
    },
  });
}

async function ensureTrackerForTask(client: DbClient, task: TaskWithTrackerContext) {
  const normalizedTitle = normalizeTitle(task.title);

  let trackerEntry =
    task.trackerEntryId
      ? await client.trackerEntry.findUnique({
          where: { id: task.trackerEntryId },
        })
      : null;

  if (!trackerEntry) {
    trackerEntry = await client.trackerEntry.findFirst({
      where: {
        userId: task.userId,
        groupId: task.groupId,
        scope: task.scope,
        blockType: task.blockType,
        normalizedTitle,
      },
    });
  }

  if (!trackerEntry) {
    trackerEntry = await client.trackerEntry.create({
      data: {
        title: task.title,
        normalizedTitle,
        scope: task.scope,
        blockType: task.blockType,
        difficulty: task.difficulty,
        userId: task.userId,
        groupId: task.groupId,
      },
    });
  } else {
    trackerEntry = await client.trackerEntry.update({
      where: { id: trackerEntry.id },
      data: {
        title: task.title,
        blockType: task.blockType,
        difficulty: task.difficulty,
      },
    });
  }

  if (task.trackerEntryId !== trackerEntry.id) {
    await client.task.update({
      where: { id: task.id },
      data: { trackerEntryId: trackerEntry.id },
    });
  }

  const logStatus = buildLogStatus(task);

  await client.trackerDailyLog.upsert({
    where: { taskId: task.id },
    create: {
      trackerEntryId: trackerEntry.id,
      taskId: task.id,
      userId: task.userId,
      groupId: task.groupId,
      day: startOfDay(task.day),
      status: logStatus.status,
      completionAt: logStatus.completionAt,
      dueAt: logStatus.dueAt,
      isLate: logStatus.isLate,
    },
    update: {
      trackerEntryId: trackerEntry.id,
      day: startOfDay(task.day),
      status: logStatus.status,
      completionAt: logStatus.completionAt,
      dueAt: logStatus.dueAt,
      isLate: logStatus.isLate,
    },
  });

  await recomputeTrackerEntry(client, trackerEntry.id);
  await recomputeUserGroupTrackerStats(client, task.userId, task.groupId);

  return trackerEntry;
}

export async function syncTaskTracker(taskId: string, client: DbClient = db) {
  const task = await fetchTaskForTracker(client, taskId);
  if (!task) return null;
  return ensureTrackerForTask(client, task);
}

export async function syncTaskTrackers(taskIds: string[], client: DbClient = db) {
  for (const taskId of taskIds) {
    await syncTaskTracker(taskId, client);
  }
}

export async function reconcileOverdueTasks(filters?: {
  userId?: string;
  groupId?: string;
  client?: DbClient;
}) {
  const client = filters?.client ?? db;
  const now = new Date();
  const todayStart = startOfDay(now);

  const overdueTasks = await client.task.findMany({
    where: {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.groupId ? { groupId: filters.groupId } : {}),
      status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      checkInId: null,
      OR: [
        { dueAt: { lt: now } },
        { dueAt: null, day: { lt: todayStart } },
      ],
    },
    select: { id: true },
  });

  if (overdueTasks.length === 0) {
    return 0;
  }

  const overdueIds = overdueTasks.map((task) => task.id);

  await client.task.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: TaskStatus.MISSED },
  });

  await syncTaskTrackers(overdueIds, client);

  return overdueIds.length;
}

function buildBlockSummary(logs: TrackerLogWithEntry[]) {
  return (Object.keys(STUDY_BLOCK_META) as StudyBlock[]).map((blockType) => {
    const blockLogs = logs.filter((log) => log.trackerEntry.blockType === blockType);
    const completed = blockLogs.filter((log) => isSuccess(log.status)).length;
    const total = blockLogs.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      blockType,
      label: STUDY_BLOCK_META[blockType].label,
      shortLabel: STUDY_BLOCK_META[blockType].shortLabel,
      description: STUDY_BLOCK_META[blockType].description,
      accent: (percent >= 75 ? "green" : percent >= 45 ? "yellow" : "red") as
        | "green"
        | "yellow"
        | "red",
      completed,
      total,
      percent,
    };
  });
}

function buildTaskCards(entries: Prisma.TrackerEntryGetPayload<{ include: { logs: true } }>[]) {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    scope: entry.scope,
    blockType: entry.blockType,
    difficulty: entry.difficulty,
    status: entry.status,
    streakCount: entry.streakCount,
    bestStreak: entry.bestStreak,
    weeklyProgress: entry.weeklyProgress,
    consistencyScore: entry.consistencyScore,
    totalCompletions: entry.totalCompletions,
    totalMisses: entry.totalMisses,
    dailyLog: entry.logs
      .sort((a, b) => b.day.getTime() - a.day.getTime())
      .slice(0, 7)
      .map((log) => ({
        day: log.day,
        status: log.status,
        isLate: log.isLate,
      })),
  }));
}

function buildHeatmap(logs: TrackerLogWithEntry[]) {
  const rangeEnd = startOfDay(new Date());
  const rangeStart = subDays(rangeEnd, 27);
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const byDay = new Map<string, TrackerLogWithEntry[]>();

  for (const log of logs) {
    const key = toDayKey(log.day);
    const bucket = byDay.get(key) ?? [];
    bucket.push(log);
    byDay.set(key, bucket);
  }

  return days.map((day) => {
    const bucket = byDay.get(toDayKey(day)) ?? [];
    const completed = bucket.filter((log) => isSuccess(log.status)).length;
    const total = bucket.length;
    const status =
      bucket.length === 0
        ? TrackerLogStatus.PENDING
        : pickDailyStatus(bucket.map((log) => log.status));

    return {
      date: day,
      label: format(day, "EEE d"),
      completed,
      total,
      heat: getHeatLevel(completed, total),
      status,
    };
  });
}

function buildWeekBars(logs: TrackerLogWithEntry[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const byDay = new Map<string, TrackerLogWithEntry[]>();

  for (const log of logs) {
    const key = toDayKey(log.day);
    const bucket = byDay.get(key) ?? [];
    bucket.push(log);
    byDay.set(key, bucket);
  }

  return days.map((day) => {
    const bucket = byDay.get(toDayKey(day)) ?? [];
    const completed = bucket.filter((log) => isSuccess(log.status)).length;
    const total = bucket.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      date: day,
      label: format(day, "EEE"),
      completed,
      total,
      percent,
    };
  });
}

async function buildReflectionSummary(input: {
  tasks: Array<{
    title: string;
    status: TrackerLogStatus;
    blockType: StudyBlock;
  }>;
  understanding: ReflectionUnderstanding;
  tomorrowPlan: string;
  consistencyScore: number;
}) {
  const completed = input.tasks.filter((task) => isSuccess(task.status)).length;
  const missed = input.tasks.filter((task) => task.status === TrackerLogStatus.MISSED).length;
  const blockCount = new Map<StudyBlock, number>();

  for (const task of input.tasks) {
    if (!isSuccess(task.status)) continue;
    blockCount.set(task.blockType, (blockCount.get(task.blockType) ?? 0) + 1);
  }

  const topBlock =
    [...blockCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? StudyBlock.DEEP_WORK;
  const understandingLabel =
    input.understanding === ReflectionUnderstanding.UNDERSTOOD
      ? "You finished the day with clear understanding."
      : input.understanding === ReflectionUnderstanding.PARTIALLY_UNDERSTOOD
        ? "You made progress, but a few concepts still need another pass."
        : "Today exposed real gaps, which is useful because it points to the next fix.";
  const fallback = `${understandingLabel} You closed ${completed} task(s), missed ${missed}, and your consistency score landed at ${input.consistencyScore}. Your strongest momentum showed up in ${STUDY_BLOCK_META[topBlock].label}. Tomorrow focus: ${input.tomorrowPlan}.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUMMARY_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You summarize a student's study day. Be concise, motivating, and specific. Mention momentum, blockers, and tomorrow's focus in under 80 words.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const outputText =
      payload.output_text ||
      payload.output?.[0]?.content?.find((item: { type?: string }) => item.type === "output_text")
        ?.text;

    return typeof outputText === "string" && outputText.trim() ? outputText.trim() : fallback;
  } catch {
    return fallback;
  }
}

export async function submitDailyReflection(input: ReflectionPayload) {
  const tomorrowPlan = input.tomorrowPlan.trim();
  const note = input.note?.trim() || null;

  if (!tomorrowPlan) {
    throw new Error("Tomorrow plan is required");
  }

  await reconcileOverdueTasks({ userId: input.userId, groupId: input.groupId });

  const today = startOfDay(new Date());
  const overview = await getTrackerOverview(input.userId, input.groupId);
  const aiSummary = await buildReflectionSummary({
    tasks: [...overview.personalEntries, ...overview.groupEntries].map((entry) => ({
      title: entry.title,
      status: entry.status,
      blockType: entry.blockType,
    })),
    understanding: input.understanding,
    tomorrowPlan,
    consistencyScore: overview.summary.consistencyScore,
  });

  return db.dailyReflection.upsert({
    where: {
      userId_groupId_day: {
        userId: input.userId,
        groupId: input.groupId,
        day: today,
      },
    },
    create: {
      userId: input.userId,
      groupId: input.groupId,
      day: today,
      understanding: input.understanding,
      tomorrowPlan,
      note,
      aiSummary,
      taskSummary: {
        personalTracked: overview.personalEntries.length,
        groupTracked: overview.groupEntries.length,
        blocks: overview.blocks.map((block) => ({
          blockType: block.blockType,
          completed: block.completed,
          total: block.total,
          percent: block.percent,
        })),
      },
      completionRate: overview.summary.weeklyCompletionRate,
      consistencyScore: overview.summary.consistencyScore,
    },
    update: {
      understanding: input.understanding,
      tomorrowPlan,
      note,
      aiSummary,
      taskSummary: {
        personalTracked: overview.personalEntries.length,
        groupTracked: overview.groupEntries.length,
        blocks: overview.blocks.map((block) => ({
          blockType: block.blockType,
          completed: block.completed,
          total: block.total,
          percent: block.percent,
        })),
      },
      completionRate: overview.summary.weeklyCompletionRate,
      consistencyScore: overview.summary.consistencyScore,
    },
  });
}

export async function generateWeeklyReportForMembership(input: {
  userId: string;
  groupId: string;
  weekStart?: Date;
}) {
  const weekStart = startOfWeek(input.weekStart ?? new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  await reconcileOverdueTasks({ userId: input.userId, groupId: input.groupId });

  const logs = await db.trackerDailyLog.findMany({
    where: {
      userId: input.userId,
      groupId: input.groupId,
      day: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      trackerEntry: {
        select: {
          title: true,
          blockType: true,
          difficulty: true,
          scope: true,
        },
      },
    },
    orderBy: { day: "asc" },
  });

  const dayStatuses = collapseLogsByDay(logs);
  const streaks = calculateCalendarStreaks(dayStatuses);
  const completed = logs.filter((log) => log.status === TrackerLogStatus.COMPLETED).length;
  const late = logs.filter((log) => log.status === TrackerLogStatus.LATE).length;
  const missed = logs.filter((log) => log.status === TrackerLogStatus.MISSED).length;
  const weightedPossible = logs.reduce(
    (sum, log) => sum + DIFFICULTY_WEIGHT[log.trackerEntry.difficulty],
    0,
  );
  const weightedCompleted = logs.reduce((sum, log) => {
    const weight = DIFFICULTY_WEIGHT[log.trackerEntry.difficulty];
    if (log.status === TrackerLogStatus.COMPLETED) return sum + weight;
    if (log.status === TrackerLogStatus.LATE) return sum + weight * 0.8;
    return sum;
  }, 0);
  const consistency = calculateConsistencyScore({
    completed,
    late,
    missed,
    total: logs.length,
    currentStreak: streaks.current,
    weightedCompleted,
    weightedPossible,
  });
  const completionRate =
    logs.length === 0 ? 0 : Math.round(((completed + late) / logs.length) * 100);
  const blockSummary = buildBlockSummary(logs as TrackerLogWithEntry[]);

  const strongAreas = blockSummary
    .filter((block) => block.total > 0 && block.percent >= 70)
    .map((block) => ({
      label: block.label,
      percent: block.percent,
    }));

  const weakAreas = blockSummary
    .filter((block) => block.total > 0 && block.percent < 60)
    .map((block) => ({
      label: block.label,
      percent: block.percent,
    }));

  const previousReport = await db.weeklyReport.findFirst({
    where: {
      userId: input.userId,
      groupId: input.groupId,
      weekStart: { lt: weekStart },
    },
    orderBy: { weekStart: "desc" },
    select: { consistencyScore: true },
  });

  const trendDelta = consistency.score - (previousReport?.consistencyScore ?? consistency.score);
  const trend =
    trendDelta >= 5
      ? WeeklyTrend.IMPROVING
      : trendDelta <= -5
        ? WeeklyTrend.DECLINING
        : WeeklyTrend.STABLE;

  const topStrong = strongAreas[0]?.label ?? "No clear strong area yet";
  const topWeak = weakAreas[0]?.label ?? "No major weak area surfaced";
  const summary = `You completed ${completed + late} task(s) this week with a ${completionRate}% finish rate. Consistency closed at ${consistency.score}, with ${topStrong} acting as your strongest lane and ${topWeak} needing the most cleanup.`;

  return db.weeklyReport.upsert({
    where: {
      userId_groupId_weekStart: {
        userId: input.userId,
        groupId: input.groupId,
        weekStart,
      },
    },
    create: {
      userId: input.userId,
      groupId: input.groupId,
      weekStart,
      weekEnd,
      completedTasks: completed + late,
      missedTasks: missed,
      completionRate,
      consistencyScore: consistency.score,
      strongAreas,
      weakAreas,
      trend,
      blockSummary,
      summary,
    },
    update: {
      weekEnd,
      completedTasks: completed + late,
      missedTasks: missed,
      completionRate,
      consistencyScore: consistency.score,
      strongAreas,
      weakAreas,
      trend,
      blockSummary,
      summary,
      generatedAt: new Date(),
    },
  });
}

export async function generateWeeklyReportsForAllMemberships(weekStart?: Date) {
  const memberships = await db.userGroup.findMany({
    select: {
      userId: true,
      groupId: true,
    },
  });

  const reports: Awaited<ReturnType<typeof generateWeeklyReportForMembership>>[] = [];
  for (const membership of memberships) {
    reports.push(
      await generateWeeklyReportForMembership({
        userId: membership.userId,
        groupId: membership.groupId,
        weekStart,
      }),
    );
  }

  return reports;
}

export async function getTrackerOverview(userId: string, groupId: string) {
  await reconcileOverdueTasks({ userId, groupId });

  const [membership, trackerEntries, recentLogs, todayReflection, recentReports] =
    await Promise.all([
      db.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        include: {
          user: { select: { name: true } },
          group: { select: { name: true } },
        },
      }),
      db.trackerEntry.findMany({
        where: { userId, groupId },
        include: {
          logs: {
            where: {
              day: {
                gte: subDays(startOfDay(new Date()), 6),
              },
            },
            orderBy: { day: "desc" },
          },
        },
        orderBy: [{ consistencyScore: "desc" }, { updatedAt: "desc" }],
      }),
      db.trackerDailyLog.findMany({
        where: {
          userId,
          groupId,
          day: {
            gte: subDays(startOfDay(new Date()), 27),
          },
        },
        include: {
          trackerEntry: {
            select: {
              id: true,
              title: true,
              scope: true,
              blockType: true,
              difficulty: true,
            },
          },
        },
        orderBy: { day: "asc" },
      }),
      db.dailyReflection.findUnique({
        where: {
          userId_groupId_day: {
            userId,
            groupId,
            day: startOfDay(new Date()),
          },
        },
      }),
      db.weeklyReport.findMany({
        where: { userId, groupId },
        orderBy: { weekStart: "desc" },
        take: 4,
      }),
    ]);

  if (!membership) {
    throw new Error("Membership not found");
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyLogs = recentLogs.filter((log) => log.day >= weekStart);
  const weeklyCompleted = weeklyLogs.filter((log) => isSuccess(log.status)).length;
  const weeklyCompletionRate =
    weeklyLogs.length === 0 ? 0 : Math.round((weeklyCompleted / weeklyLogs.length) * 100);

  return {
    summary: {
      userName: membership.user.name,
      groupName: membership.group.name,
      consistencyScore: membership.consistencyScore,
      weeklyConsistency: membership.weeklyConsistency,
      dailyStreak: membership.streak,
      bestStreak: membership.bestStreak,
      totalCompleted: membership.completions,
      totalMissed: membership.misses,
      weeklyCompletionRate,
    },
    personalEntries: buildTaskCards(
      trackerEntries.filter((entry) => entry.scope === TaskScope.PERSONAL),
    ),
    groupEntries: buildTaskCards(
      trackerEntries.filter((entry) => entry.scope === TaskScope.GROUP),
    ),
    blocks: buildBlockSummary(recentLogs as TrackerLogWithEntry[]),
    heatmap: buildHeatmap(recentLogs as TrackerLogWithEntry[]),
    weekBars: buildWeekBars(recentLogs as TrackerLogWithEntry[]),
    reflection: todayReflection,
    recentReports: recentReports.map((report) => ({
      id: report.id,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      completedTasks: report.completedTasks,
      missedTasks: report.missedTasks,
      consistencyScore: report.consistencyScore,
      completionRate: report.completionRate,
      trend: report.trend,
      summary: report.summary,
      strongAreas: report.strongAreas,
      weakAreas: report.weakAreas,
      blockSummary: report.blockSummary,
    })),
    formula: {
      completionWeight: 60,
      streakWeight: 25,
      difficultyWeight: 15,
      latePenalty: 10,
      weeklyWindowDays: 7,
    },
  };
}

export async function getGroupConsistencyLeaderboard(groupId: string) {
  await reconcileOverdueTasks({ groupId });

  const rows = await db.userGroup.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: [
      { consistencyScore: "desc" },
      { weeklyConsistency: "desc" },
      { streak: "desc" },
      { completions: "desc" },
    ],
  });

  const latestReports = await db.weeklyReport.findMany({
    where: { groupId },
    orderBy: { weekStart: "desc" },
    take: rows.length * 2,
  });

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.user.name,
    image: row.user.image,
    consistencyScore: row.consistencyScore,
    weeklyConsistency: row.weeklyConsistency,
    streak: row.streak,
    bestStreak: row.bestStreak,
    completions: row.completions,
    misses: row.misses,
    report: latestReports.find((report) => report.userId === row.userId) ?? null,
  }));
}

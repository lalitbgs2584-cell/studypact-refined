import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";

import { db } from "@/lib/db";
import {
  DSA_PROBLEMS,
  DSA_PROBLEM_MAP,
  DSA_TOPIC_ORDER,
  DSA_WEEK_THEMES,
  DSA_WEEKLY_BUCKETS,
  type DsaProblem,
  type DsaVaultState,
} from "@/lib/dsa-data";

export type DsaProblemOutcome = "FAILED" | "HARD" | "SOLVED";

export type DsaMissionProblemStatus = "PENDING" | DsaProblemOutcome;

export type DsaMissionSlot =
  | "MUST DO"
  | "WEAK TOPIC"
  | "GOOD_PROBLEM REVIEW"
  | "HIGH";

type DsaMissionRecord = {
  date: string;
  day: number;
  week: number;
  focus: string;
  message: string;
  weekTheme: string;
  phase: "NEW" | "MIXED" | "REVISION";
  carryForward: boolean;
  problems: Array<{
    problemId: number;
    priority: DsaMissionSlot;
    reason: string;
    status: DsaMissionProblemStatus;
    assignedFrom: "NEW" | "REVIEW" | "WEAK" | "CARRY_FORWARD";
  }>;
};

type DsaProblemProgress = {
  state: DsaVaultState;
  attempts: number;
  failCount: number;
  hardCount: number;
  solvedCount: number;
  reviewCount: number;
  goodProblem: boolean;
  lastResult: DsaProblemOutcome | null;
  lastTouchedAt: string | null;
  nextReviewAt: string | null;
};

type DsaVaultStore = {
  version: 1;
  createdAt: string;
  streak: number;
  bestStreak: number;
  lastQualifiedDate: string | null;
  dayCursor: number;
  missions: Record<string, DsaMissionRecord>;
  problems: Record<string, DsaProblemProgress>;
};

type TopicStat = {
  topic: string;
  touched: number;
  solved: number;
  review: number;
  failed: number;
  mastery: number;
  weaknessScore: number;
  interviewReady: boolean;
};

export type DsaMissionPayload = {
  day: number;
  focus: string;
  problems: Array<{
    id: number;
    name: string;
    platform: string;
    url: string;
    topic: string;
    pattern: string;
    priority: DsaMissionSlot;
    reason: string;
    status: DsaMissionProblemStatus;
    vaultState: DsaVaultState;
    goodProblem: boolean;
  }>;
  message: string;
  tracker: {
    streak: number;
    bestStreak: number;
    completionPercent: number;
    weeklyProgressPercent: number;
    missionCompleted: boolean;
    completedToday: number;
    interviewReadyTopics: string[];
    weakTopics: string[];
    currentWeek: number;
    weekTheme: string;
    phase: "NEW" | "MIXED" | "REVISION";
    extraChallenge: {
      id: number;
      name: string;
      url: string;
      topic: string;
    } | null;
  };
};

const DSA_VAULT_KEY_PREFIX = "dsa:vault";
const DSA_JOURNEY_KEY_PREFIX = "dsa:journey-start";

function buildVaultKey(userId: string) {
  return `${DSA_VAULT_KEY_PREFIX}:${userId}`;
}

function buildJourneyKey(userId: string) {
  return `${DSA_JOURNEY_KEY_PREFIX}:${userId}`;
}

function todayKey(date = new Date()) {
  return format(startOfDay(date), "yyyy-MM-dd");
}

function plusDaysKey(dateString: string, days: number) {
  return todayKey(addDays(parseISO(`${dateString}T00:00:00.000Z`), days));
}

function emptyProgress(): DsaProblemProgress {
  return {
    state: "NOT_SOLVED",
    attempts: 0,
    failCount: 0,
    hardCount: 0,
    solvedCount: 0,
    reviewCount: 0,
    goodProblem: false,
    lastResult: null,
    lastTouchedAt: null,
    nextReviewAt: null,
  };
}

function createEmptyVault(): DsaVaultStore {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    streak: 0,
    bestStreak: 0,
    lastQualifiedDate: null,
    dayCursor: 0,
    missions: {},
    problems: {},
  };
}

async function loadVault(userId: string) {
  const setting = await db.systemSetting.findUnique({
    where: { key: buildVaultKey(userId) },
    select: { value: true },
  });

  if (!setting) {
    return createEmptyVault();
  }

  try {
    const parsed = JSON.parse(setting.value) as DsaVaultStore;
    return {
      ...createEmptyVault(),
      ...parsed,
      missions: parsed.missions ?? {},
      problems: parsed.problems ?? {},
    };
  } catch {
    return createEmptyVault();
  }
}

export async function getDsaJourneyStartedAt(userId: string) {
  const setting = await db.systemSetting.findUnique({
    where: { key: buildJourneyKey(userId) },
    select: { value: true },
  });

  return setting?.value ?? null;
}

export async function hasStartedDsaJourney(userId: string) {
  return (await getDsaJourneyStartedAt(userId)) !== null;
}

export async function startDsaJourneyForUser(userId: string, date = new Date()) {
  const existing = await getDsaJourneyStartedAt(userId);
  if (existing) {
    return existing;
  }

  const startedAt = todayKey(date);

  await db.systemSetting.create({
    data: {
      key: buildJourneyKey(userId),
      value: startedAt,
      description: "StudyPact DSA journey start date",
    },
  });

  return startedAt;
}

async function saveVault(userId: string, vault: DsaVaultStore) {
  await db.systemSetting.upsert({
    where: { key: buildVaultKey(userId) },
    create: {
      key: buildVaultKey(userId),
      value: JSON.stringify(vault),
      description: "StudyPact DSA adaptive vault",
    },
    update: {
      value: JSON.stringify(vault),
    },
  });
}

function readProgress(vault: DsaVaultStore, problemId: number): DsaProblemProgress {
  return vault.problems[String(problemId)] ?? emptyProgress();
}

function getProgress(vault: DsaVaultStore, problemId: number) {
  const key = String(problemId);
  if (!vault.problems[key]) {
    vault.problems[key] = emptyProgress();
  }
  return vault.problems[key];
}

function refreshDueReviews(vault: DsaVaultStore, date = new Date()) {
  const key = todayKey(date);

  for (const [problemId, progress] of Object.entries(vault.problems)) {
    if (!progress.nextReviewAt) continue;
    if (progress.state === "ATTEMPTED" || progress.state === "REVISION") continue;
    if (progress.nextReviewAt <= key) {
      const wasGoodProblem = progress.goodProblem || progress.state === "GOOD_PROBLEM";
      progress.state = "REVISION";
      progress.goodProblem = wasGoodProblem;
    }

    if (!DSA_PROBLEM_MAP.has(Number(problemId))) {
      delete vault.problems[problemId];
    }
  }
}

function computeTopicStats(vault: DsaVaultStore): TopicStat[] {
  return DSA_TOPIC_ORDER.map((topic) => {
    const topicProblems = DSA_PROBLEMS.filter((problem) => problem.topic === topic);
    const touchedStates = topicProblems
      .map((problem) => readProgress(vault, problem.id))
      .filter((progress) => progress.attempts > 0 || progress.solvedCount > 0 || progress.reviewCount > 0);

    const touched = touchedStates.length;
    const solved = touchedStates.filter((progress) => progress.solvedCount > 0 || progress.goodProblem).length;
    const review = touchedStates.filter((progress) => progress.state === "REVISION").length;
    const failed = touchedStates.reduce((sum, progress) => sum + progress.failCount, 0);
    const mastery =
      touched === 0 ? 0 : Math.max(0, Math.min(1, (solved + touchedStates.reduce((sum, progress) => sum + progress.reviewCount * 0.3, 0) - failed * 0.35) / touched));
    const weaknessScore =
      touchedStates.reduce((sum, progress) => {
        const attemptedPenalty = progress.state === "ATTEMPTED" ? 2 : 0;
        const revisionPenalty = progress.state === "REVISION" ? 1.5 : 0;
        return sum + progress.failCount * 2 + attemptedPenalty + revisionPenalty - progress.solvedCount * 0.35;
      }, 0) +
      (touched === 0 ? 0.25 : 0);
    const interviewReady =
      touched >= 3 &&
      mastery >= 0.8 &&
      failed <= Math.max(1, Math.floor(touched * 0.2)) &&
      touchedStates.some((progress) => progress.reviewCount >= 1);

    return {
      topic,
      touched,
      solved,
      review,
      failed,
      mastery,
      weaknessScore,
      interviewReady,
    };
  });
}

function getWeakTopics(vault: DsaVaultStore, weekTopics: string[]) {
  const stats = computeTopicStats(vault)
    .filter((stat) => stat.touched > 0)
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const inWeek = stats.filter((stat) => weekTopics.includes(stat.topic) && stat.weaknessScore > 0.6);
  if (inWeek.length > 0) {
    return inWeek.map((stat) => stat.topic);
  }

  if (stats.length > 0) {
    return stats.filter((stat) => stat.weaknessScore > 0.6).map((stat) => stat.topic);
  }

  return weekTopics;
}

function isSolvedEnough(progress: DsaProblemProgress) {
  return progress.solvedCount > 0 || progress.goodProblem || progress.state === "SOLVED" || progress.state === "GOOD_PROBLEM";
}

function pickProblem(options: {
  pool: DsaProblem[];
  vault: DsaVaultStore;
  excludeIds: Set<number>;
  reviewOnly?: boolean;
}) {
  const { pool, vault, excludeIds, reviewOnly = false } = options;

  for (const problem of pool) {
    if (excludeIds.has(problem.id)) continue;
    const progress = readProgress(vault, problem.id);
    const dueReview =
      progress.state === "REVISION" ||
      (progress.nextReviewAt !== null && progress.nextReviewAt <= todayKey());

    if (reviewOnly) {
      if (dueReview || (progress.goodProblem && progress.lastTouchedAt && differenceInCalendarDays(new Date(), parseISO(progress.lastTouchedAt)) >= 3)) {
        return problem;
      }
      continue;
    }

    if (!isSolvedEnough(progress)) {
      return problem;
    }
  }

  return null;
}

function pickWeakProblem(options: {
  vault: DsaVaultStore;
  excludeIds: Set<number>;
  weakTopics: string[];
  fallbackTopics: string[];
}) {
  const { vault, excludeIds, weakTopics, fallbackTopics } = options;
  const topicCandidates = [...weakTopics, ...fallbackTopics];

  for (const topic of topicCandidates) {
    const retryPool = DSA_PROBLEMS.filter((problem) => {
      if (problem.topic !== topic || excludeIds.has(problem.id)) return false;
      const progress = readProgress(vault, problem.id);
      return progress.state === "ATTEMPTED" || progress.state === "REVISION";
    }).sort((a, b) => {
      const aPriority = a.priority === "MUST DO" ? 0 : 1;
      const bPriority = b.priority === "MUST DO" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.id - b.id;
    });

    if (retryPool[0]) {
      return retryPool[0];
    }

    const unsolvedPool = DSA_PROBLEMS.filter((problem) => {
      if (problem.topic !== topic || excludeIds.has(problem.id)) return false;
      return !isSolvedEnough(readProgress(vault, problem.id));
    }).sort((a, b) => {
      const aPriority = a.priority === "MUST DO" ? 0 : 1;
      const bPriority = b.priority === "MUST DO" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.id - b.id;
    });

    if (unsolvedPool[0]) {
      return unsolvedPool[0];
    }
  }

  return null;
}

function buildReason(input: {
  kind: DsaMissionSlot;
  problem: DsaProblem;
  focus: string;
  weakTopics: string[];
  carryForward?: boolean;
}) {
  if (input.carryForward) {
    return "carried forward after a missed day so momentum resumes without overload";
  }

  if (input.kind === "MUST DO") {
    return "core placement problem for the current week; this is the non-negotiable anchor";
  }

  if (input.kind === "WEAK TOPIC") {
    return `selected from ${input.weakTopics[0] ?? input.problem.topic} because recent attempts show it needs deliberate reps`;
  }

  if (input.kind === "GOOD_PROBLEM REVIEW") {
    return "spaced repetition on a high-signal problem so the pattern survives interview pressure";
  }

  return `stretch problem for ${input.focus.toLowerCase()} to deepen transfer, not just speed`;
}

function buildMessage(input: {
  focus: string;
  phase: "NEW" | "MIXED" | "REVISION";
  carryForward: boolean;
}) {
  if (input.carryForward) {
    return `Today is a recovery day: finish the carry-forward set cleanly and stop at two solid reps.`;
  }

  if (input.phase === "REVISION") {
    return `Revision day. Re-solve from memory, keep the code clean, and treat speed as a byproduct of recall.`;
  }

  if (input.phase === "MIXED") {
    return `Mixed day: one core rep, one weak-topic rep, one review signal. Stay precise, not fast.`;
  }

  return `Today's mission is ${input.focus.toLowerCase()}. Start with the winnable core problem and earn depth on the second one.`;
}

function getWeekInfo(dayNumber: number) {
  const clampedWeek = Math.min(DSA_WEEK_THEMES.length, Math.ceil(dayNumber / 7));
  const phaseIndex = ((dayNumber - 1) % 7) + 1;
  const phase = phaseIndex <= 4 ? "NEW" : phaseIndex <= 6 ? "MIXED" : "REVISION";
  const weekTheme = DSA_WEEK_THEMES[clampedWeek - 1];
  return {
    week: clampedWeek,
    weekTheme,
    phase,
  } as const;
}

function isMissionQualified(mission: DsaMissionRecord) {
  const mustDo = mission.problems.find((problem) => problem.priority === "MUST DO");
  const attemptedCount = mission.problems.filter((problem) => problem.status !== "PENDING").length;
  return (
    !!mustDo &&
    (mustDo.status === "HARD" || mustDo.status === "SOLVED") &&
    attemptedCount >= Math.min(2, mission.problems.length)
  );
}

function updateStreak(vault: DsaVaultStore, dateString: string) {
  if (vault.lastQualifiedDate === dateString) {
    return;
  }

  if (!vault.lastQualifiedDate) {
    vault.streak = 1;
  } else {
    const diff = differenceInCalendarDays(
      parseISO(`${dateString}T00:00:00.000Z`),
      parseISO(`${vault.lastQualifiedDate}T00:00:00.000Z`),
    );
    vault.streak = diff === 1 ? vault.streak + 1 : 1;
  }

  vault.bestStreak = Math.max(vault.bestStreak, vault.streak);
  vault.lastQualifiedDate = dateString;
}

function getCompletionPercent(vault: DsaVaultStore) {
  const completed = DSA_PROBLEMS.filter((problem) => isSolvedEnough(readProgress(vault, problem.id))).length;
  return Math.round((completed / DSA_PROBLEMS.length) * 100);
}

function getWeeklyProgressPercent(vault: DsaVaultStore, week: number) {
  const bucket = DSA_WEEKLY_BUCKETS[week - 1];
  const completed = bucket.problems.filter((problem) => isSolvedEnough(readProgress(vault, problem.id))).length;
  return bucket.problems.length === 0 ? 0 : Math.round((completed / bucket.problems.length) * 100);
}

function getExtraChallenge(vault: DsaVaultStore, mission: DsaMissionRecord) {
  const bucket = DSA_WEEKLY_BUCKETS[mission.week - 1];
  const assignedIds = new Set(mission.problems.map((problem) => problem.problemId));
  const candidate = bucket.problems.find((problem) => {
    if (assignedIds.has(problem.id)) return false;
    return !isSolvedEnough(readProgress(vault, problem.id));
  });

  if (!candidate) return null;

  return {
    id: candidate.id,
    name: candidate.name,
    url: candidate.url,
    topic: candidate.topic,
  };
}

function toPayload(vault: DsaVaultStore, mission: DsaMissionRecord): DsaMissionPayload {
  const topicStats = computeTopicStats(vault);
  const interviewReadyTopics = topicStats.filter((stat) => stat.interviewReady).map((stat) => stat.topic);
  const weakTopics = getWeakTopics(vault, DSA_WEEK_THEMES[mission.week - 1].topics).slice(0, 3);
  const completedToday = mission.problems.filter((problem) => problem.status !== "PENDING").length;

  return {
    day: mission.day,
    focus: mission.focus,
    problems: mission.problems.map((entry) => {
      const problem = DSA_PROBLEM_MAP.get(entry.problemId)!;
      const progress = readProgress(vault, problem.id);
      return {
        id: problem.id,
        name: problem.name,
        platform: problem.platform,
        url: problem.url,
        topic: problem.topic,
        pattern: problem.pattern,
        priority: entry.priority,
        reason: entry.reason,
        status: entry.status,
        vaultState: progress.state,
        goodProblem: progress.goodProblem,
      };
    }),
    message: mission.message,
    tracker: {
      streak: vault.streak,
      bestStreak: vault.bestStreak,
      completionPercent: getCompletionPercent(vault),
      weeklyProgressPercent: getWeeklyProgressPercent(vault, mission.week),
      missionCompleted: isMissionQualified(mission),
      completedToday,
      interviewReadyTopics,
      weakTopics,
      currentWeek: mission.week,
      weekTheme: mission.weekTheme,
      phase: mission.phase,
      extraChallenge:
        mission.problems.every((problem) => problem.status === "HARD" || problem.status === "SOLVED")
          ? getExtraChallenge(vault, mission)
          : null,
    },
  };
}

function createMission(vault: DsaVaultStore, dateString: string) {
  const dayNumber = vault.dayCursor + 1;
  const { week, weekTheme, phase } = getWeekInfo(dayNumber);
  const excludeIds = new Set<number>();
  const weakTopics = getWeakTopics(vault, weekTheme.topics);
  const bucket = DSA_WEEKLY_BUCKETS[week - 1];

  const previousMission = Object.values(vault.missions)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
  const carryForwardProblems =
    previousMission && previousMission.date !== dateString && !isMissionQualified(previousMission)
      ? previousMission.problems.filter((problem) => problem.status === "PENDING").slice(0, 2)
      : [];

  const missionProblems: DsaMissionRecord["problems"] = [];

  for (const pending of carryForwardProblems) {
    excludeIds.add(pending.problemId);
    missionProblems.push({
      problemId: pending.problemId,
      priority: pending.priority,
      reason: buildReason({
        kind: pending.priority,
        problem: DSA_PROBLEM_MAP.get(pending.problemId)!,
        focus: weekTheme.theme,
        weakTopics,
        carryForward: true,
      }),
      status: "PENDING",
      assignedFrom: "CARRY_FORWARD",
    });
  }

  const remainingSlots = carryForwardProblems.length > 0 ? 2 - carryForwardProblems.length : 3;

  if (remainingSlots > 0) {
    const mustDoProblem =
      pickProblem({
        pool: bucket.problems.filter((problem) => problem.priority === "MUST DO"),
        vault,
        excludeIds,
      }) ??
      pickProblem({
        pool: DSA_PROBLEMS.filter((problem) => problem.priority === "MUST DO"),
        vault,
        excludeIds,
      });

    if (mustDoProblem) {
      excludeIds.add(mustDoProblem.id);
      missionProblems.push({
        problemId: mustDoProblem.id,
        priority: "MUST DO",
        reason: buildReason({
          kind: "MUST DO",
          problem: mustDoProblem,
          focus: weekTheme.theme,
          weakTopics,
        }),
        status: "PENDING",
        assignedFrom: "NEW",
      });
    }
  }

  if (missionProblems.length < (carryForwardProblems.length > 0 ? 2 : 3)) {
    const weakProblem = pickWeakProblem({
      vault,
      excludeIds,
      weakTopics,
      fallbackTopics: bucket.problems.map((problem) => problem.topic),
    });

    if (weakProblem) {
      excludeIds.add(weakProblem.id);
      missionProblems.push({
        problemId: weakProblem.id,
        priority: "WEAK TOPIC",
        reason: buildReason({
          kind: "WEAK TOPIC",
          problem: weakProblem,
          focus: weekTheme.theme,
          weakTopics,
        }),
        status: "PENDING",
        assignedFrom: readProgress(vault, weakProblem.id).state === "REVISION" ? "REVIEW" : "WEAK",
      });
    }
  }

  if (missionProblems.length < (carryForwardProblems.length > 0 ? 2 : 3)) {
    const reviewPool = DSA_PROBLEMS.filter((problem) => {
      if (excludeIds.has(problem.id)) return false;
      const progress = readProgress(vault, problem.id);
      return (
        progress.state === "REVISION" ||
        (progress.goodProblem &&
          progress.lastTouchedAt &&
          differenceInCalendarDays(new Date(), parseISO(progress.lastTouchedAt)) >= 3)
      );
    }).sort((a, b) => {
      const aPriority = a.priority === "MUST DO" ? 0 : 1;
      const bPriority = b.priority === "MUST DO" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.id - b.id;
    });

    const reviewProblem =
      reviewPool[0] ??
      pickProblem({
        pool:
          phase === "REVISION"
            ? DSA_PROBLEMS.filter((problem) => !excludeIds.has(problem.id))
            : bucket.problems.filter((problem) => !excludeIds.has(problem.id)),
        vault,
        excludeIds,
      });

    if (reviewProblem) {
      const progress = readProgress(vault, reviewProblem.id);
      missionProblems.push({
        problemId: reviewProblem.id,
        priority:
          progress.state === "REVISION" || progress.goodProblem ? "GOOD_PROBLEM REVIEW" : "HIGH",
        reason: buildReason({
          kind:
            progress.state === "REVISION" || progress.goodProblem
              ? "GOOD_PROBLEM REVIEW"
              : "HIGH",
          problem: reviewProblem,
          focus: weekTheme.theme,
          weakTopics,
        }),
        status: "PENDING",
        assignedFrom:
          progress.state === "REVISION" || progress.goodProblem ? "REVIEW" : "NEW",
      });
    }
  }

  const mission: DsaMissionRecord = {
    date: dateString,
    day: dayNumber,
    week,
    focus: weakTopics[0] ?? weekTheme.theme,
    message: buildMessage({
      focus: weakTopics[0] ?? weekTheme.theme,
      phase,
      carryForward: carryForwardProblems.length > 0,
    }),
    weekTheme: weekTheme.theme,
    phase,
    carryForward: carryForwardProblems.length > 0,
    problems: missionProblems,
  };

  vault.dayCursor = dayNumber;
  vault.missions[dateString] = mission;

  return mission;
}

export async function getTodayDsaMission(userId: string, date = new Date()) {
  const vault = await loadVault(userId);
  refreshDueReviews(vault, date);
  const key = todayKey(date);
  const mission = vault.missions[key] ?? createMission(vault, key);
  await saveVault(userId, vault);
  return toPayload(vault, mission);
}

export async function updateTodayDsaMission(
  userId: string,
  input: { problemId: number; outcome: DsaProblemOutcome },
  date = new Date(),
) {
  const vault = await loadVault(userId);
  refreshDueReviews(vault, date);
  const key = todayKey(date);
  const mission = vault.missions[key] ?? createMission(vault, key);
  const target = mission.problems.find((problem) => problem.problemId === input.problemId);

  if (!target) {
    throw new Error("Problem is not part of today's mission");
  }

  target.status = input.outcome;

  const progress = getProgress(vault, input.problemId);
  const problem = DSA_PROBLEM_MAP.get(input.problemId);

  if (!problem) {
    throw new Error("Problem not found");
  }

  const isReviewAttempt =
    target.assignedFrom === "REVIEW" ||
    progress.state === "REVISION" ||
    progress.goodProblem;

  progress.attempts += 1;
  progress.lastResult = input.outcome;
  progress.lastTouchedAt = new Date().toISOString();

  if (input.outcome === "FAILED") {
    progress.failCount += 1;
    progress.state = "ATTEMPTED";
    progress.nextReviewAt = null;
  } else if (input.outcome === "HARD") {
    progress.hardCount += 1;
    progress.solvedCount += 1;
    progress.goodProblem = progress.goodProblem || problem.priority === "MUST DO";
    progress.state = "REVISION";
    progress.nextReviewAt = plusDaysKey(key, 4);
    if (isReviewAttempt) {
      progress.reviewCount += 1;
    }
  } else {
    progress.solvedCount += 1;
    progress.goodProblem = progress.goodProblem || problem.priority === "MUST DO";
    progress.state = progress.goodProblem ? "GOOD_PROBLEM" : "SOLVED";
    progress.nextReviewAt = plusDaysKey(key, progress.goodProblem ? 4 : 5);
    if (isReviewAttempt) {
      progress.reviewCount += 1;
    }
  }

  if (isMissionQualified(mission)) {
    updateStreak(vault, key);
  }

  await saveVault(userId, vault);
  return toPayload(vault, mission);
}

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "VerificationVerdict" AS ENUM ('APPROVE', 'FLAG', 'SPAM', 'IRRELEVANT');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('PENALIZED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "GroupFocusType" AS ENUM ('GENERAL', 'DSA', 'DEVELOPMENT', 'EXAM_PREP', 'MACHINE_LEARNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskPostingMode" AS ENUM ('ADMINS_ONLY', 'ALL_MEMBERS');

-- CreateEnum
CREATE TYPE "PenaltyMode" AS ENUM ('BURN', 'POOL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('DSA', 'DEVELOPMENT', 'REVISION', 'INTERVIEW_PREP', 'READING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskScope" AS ENUM ('PERSONAL', 'GROUP');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('PRE_DEADLINE_NUDGE', 'FLAGGED_SUBMISSION');

-- CreateEnum
CREATE TYPE "GroupMessageReactionKind" AS ENUM ('FIRE', 'CLAP', 'TARGET', 'ROCKET');

-- CreateEnum
CREATE TYPE "CheckInReactionKind" AS ENUM ('FIRE', 'STRONG', 'THINKING', 'EYES');

-- CreateEnum
CREATE TYPE "MilestoneBadgeKind" AS ENUM ('FIRST_COMPLETION', 'STREAK_7', 'ZERO_PENALTIES_MONTH', 'EARLY_BIRD_10', 'REACTIONS_50');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'FAKE_PROOF', 'HARRASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'CHECKIN', 'GROUP');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "isBlocked" BOOLEAN,
    "penaltyCount" INTEGER NOT NULL DEFAULT 0,
    "globalTrustScore" INTEGER NOT NULL DEFAULT 100,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "accurateReviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "visibility" "GroupVisibility" NOT NULL DEFAULT 'PRIVATE',
    "focusType" "GroupFocusType" NOT NULL DEFAULT 'GENERAL',
    "taskPostingMode" "TaskPostingMode" NOT NULL DEFAULT 'ALL_MEMBERS',
    "penaltyMode" "PenaltyMode" NOT NULL DEFAULT 'BURN',
    "inviteCode" TEXT NOT NULL,
    "inviteExpiresAt" TIMESTAMP(3) NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 8,
    "dailyPenalty" INTEGER NOT NULL DEFAULT 10,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "GroupRole" NOT NULL DEFAULT 'member',
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "misses" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 60,
    "inactivityStrikes" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInAt" TIMESTAMP(3),
    "earlyBirdCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_group_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'CUSTOM',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "targetMinutes" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "day" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "broadcastKey" TEXT,
    "checkInId" TEXT,
    "templateId" TEXT,
    "isChallengeMode" BOOLEAN NOT NULL DEFAULT false,
    "earlyBirdCutoff" TIMESTAMP(3),
    "scope" "TaskScope" NOT NULL DEFAULT 'PERSONAL',

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "reflection" TEXT,
    "proofText" TEXT,
    "proofLink" TEXT,
    "reviewNote" TEXT,
    "aiSummary" TEXT,
    "aiConfidence" INTEGER,
    "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "penaltyApplied" INTEGER NOT NULL DEFAULT 0,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "adminOverride" BOOLEAN NOT NULL DEFAULT false,
    "finalOutcome" "CheckInStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignmentQuestionId" TEXT,
    "reviewedById" TEXT,
    "isEarlyBird" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "check_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_question" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "assignment_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_verification" (
    "id" TEXT NOT NULL,
    "verdict" "VerificationVerdict" NOT NULL,
    "note" TEXT,
    "disputeOutcome" "DisputeOutcome",
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,

    CONSTRAINT "submission_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty_event" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "checkInId" TEXT,

    CONSTRAINT "penalty_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_message" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageName" TEXT,
    "imageStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "group_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'CUSTOM',
    "targetMinutes" INTEGER,
    "scope" "TaskScope" NOT NULL DEFAULT 'PERSONAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "task_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "start_file" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "checkInId" TEXT,

    CONSTRAINT "start_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "end_file" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "checkInId" TEXT,

    CONSTRAINT "end_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskDay" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "checkInId" TEXT,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_message_reaction" (
    "id" TEXT NOT NULL,
    "kind" "GroupMessageReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "group_message_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_reaction" (
    "id" TEXT NOT NULL,
    "kind" "CheckInReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,

    CONSTRAINT "check_in_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "group_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_of_fame" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "topUserId" TEXT NOT NULL,
    "bottomUserId" TEXT NOT NULL,
    "topName" TEXT NOT NULL,
    "bottomName" TEXT NOT NULL,
    "topStat" TEXT NOT NULL,
    "bottomStat" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hall_of_fame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_recap" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "mvpUserId" TEXT,
    "mvpName" TEXT,
    "penaltyLeaderUserId" TEXT,
    "penaltyLeaderName" TEXT,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreakName" TEXT,
    "memberStats" JSONB NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_recap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_badge" (
    "id" TEXT NOT NULL,
    "kind" "MilestoneBadgeKind" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "milestone_badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confession_post" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "confession_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confession_upvote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "confessionId" TEXT NOT NULL,

    CONSTRAINT "confession_upvote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "startFileUrl" TEXT,
    "endFileUrl" TEXT,
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "penaltyEventId" TEXT,

    CONSTRAINT "redemption_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "resolvedById" TEXT,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "group_inviteCode_key" ON "group"("inviteCode");

-- CreateIndex
CREATE INDEX "group_createdById_idx" ON "group"("createdById");

-- CreateIndex
CREATE INDEX "group_visibility_createdAt_idx" ON "group"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "user_group_groupId_idx" ON "user_group"("groupId");

-- CreateIndex
CREATE INDEX "task_userId_day_idx" ON "task"("userId", "day");

-- CreateIndex
CREATE INDEX "task_groupId_day_idx" ON "task"("groupId", "day");

-- CreateIndex
CREATE INDEX "task_template_day_idx" ON "task"("templateId", "day");

-- CreateIndex
CREATE INDEX "task_broadcastKey_idx" ON "task"("broadcastKey");

-- CreateIndex
CREATE INDEX "check_in_groupId_day_idx" ON "check_in"("groupId", "day");

-- CreateIndex
CREATE INDEX "check_in_userId_day_idx" ON "check_in"("userId", "day");

-- CreateIndex
CREATE INDEX "check_in_assignmentQuestionId_idx" ON "check_in"("assignmentQuestionId");

-- CreateIndex
CREATE INDEX "assignment_groupId_createdAt_idx" ON "assignment"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "assignment_createdById_idx" ON "assignment"("createdById");

-- CreateIndex
CREATE INDEX "assignment_question_assignmentId_order_idx" ON "assignment_question"("assignmentId", "order");

-- CreateIndex
CREATE INDEX "submission_verification_checkInId_idx" ON "submission_verification"("checkInId");

-- CreateIndex
CREATE INDEX "submission_verification_reviewerId_idx" ON "submission_verification"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_verification_checkInId_reviewerId_key" ON "submission_verification"("checkInId", "reviewerId");

-- CreateIndex
CREATE INDEX "penalty_event_groupId_createdAt_idx" ON "penalty_event"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "penalty_event_userId_createdAt_idx" ON "penalty_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "group_message_groupId_createdAt_idx" ON "group_message"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "group_message_userId_createdAt_idx" ON "group_message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "task_template_groupId_scope_isActive_idx" ON "task_template"("groupId", "scope", "isActive");

-- CreateIndex
CREATE INDEX "task_template_userId_isActive_idx" ON "task_template"("userId", "isActive");

-- CreateIndex
CREATE INDEX "start_file_groupId_idx" ON "start_file"("groupId");

-- CreateIndex
CREATE INDEX "end_file_groupId_idx" ON "end_file"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_dedupeKey_key" ON "notification_log"("dedupeKey");

-- CreateIndex
CREATE INDEX "notification_log_userId_sentAt_idx" ON "notification_log"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "notification_log_groupId_sentAt_idx" ON "notification_log"("groupId", "sentAt");

-- CreateIndex
CREATE INDEX "group_message_reaction_messageId_idx" ON "group_message_reaction"("messageId");

-- CreateIndex
CREATE INDEX "group_message_reaction_userId_idx" ON "group_message_reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_reaction_messageId_userId_kind_key" ON "group_message_reaction"("messageId", "userId", "kind");

-- CreateIndex
CREATE INDEX "check_in_reaction_checkInId_idx" ON "check_in_reaction"("checkInId");

-- CreateIndex
CREATE INDEX "check_in_reaction_userId_idx" ON "check_in_reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "check_in_reaction_checkInId_userId_kind_key" ON "check_in_reaction"("checkInId", "userId", "kind");

-- CreateIndex
CREATE INDEX "group_document_groupId_createdAt_idx" ON "group_document"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "hall_of_fame_groupId_weekStart_idx" ON "hall_of_fame"("groupId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "hall_of_fame_groupId_weekStart_key" ON "hall_of_fame"("groupId", "weekStart");

-- CreateIndex
CREATE INDEX "weekly_recap_groupId_weekStart_idx" ON "weekly_recap"("groupId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_recap_groupId_weekStart_key" ON "weekly_recap"("groupId", "weekStart");

-- CreateIndex
CREATE INDEX "milestone_badge_userId_idx" ON "milestone_badge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_badge_userId_kind_groupId_key" ON "milestone_badge"("userId", "kind", "groupId");

-- CreateIndex
CREATE INDEX "confession_post_groupId_weekStart_idx" ON "confession_post"("groupId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "confession_post_userId_groupId_weekStart_key" ON "confession_post"("userId", "groupId", "weekStart");

-- CreateIndex
CREATE INDEX "confession_upvote_confessionId_idx" ON "confession_upvote"("confessionId");

-- CreateIndex
CREATE UNIQUE INDEX "confession_upvote_confessionId_userId_key" ON "confession_upvote"("confessionId", "userId");

-- CreateIndex
CREATE INDEX "redemption_task_groupId_targetUserId_idx" ON "redemption_task"("groupId", "targetUserId");

-- CreateIndex
CREATE INDEX "redemption_task_targetUserId_idx" ON "redemption_task"("targetUserId");

-- CreateIndex
CREATE INDEX "report_targetType_targetId_idx" ON "report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_setting_key_key" ON "system_setting"("key");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group" ADD CONSTRAINT "user_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group" ADD CONSTRAINT "user_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_assignmentQuestionId_fkey" FOREIGN KEY ("assignmentQuestionId") REFERENCES "assignment_question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_question" ADD CONSTRAINT "assignment_question_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_verification" ADD CONSTRAINT "submission_verification_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_verification" ADD CONSTRAINT "submission_verification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_event" ADD CONSTRAINT "penalty_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_event" ADD CONSTRAINT "penalty_event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_event" ADD CONSTRAINT "penalty_event_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_message" ADD CONSTRAINT "group_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_message" ADD CONSTRAINT "group_message_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template" ADD CONSTRAINT "task_template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template" ADD CONSTRAINT "task_template_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template" ADD CONSTRAINT "task_template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_file" ADD CONSTRAINT "start_file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_file" ADD CONSTRAINT "start_file_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_file" ADD CONSTRAINT "start_file_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_file" ADD CONSTRAINT "end_file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_file" ADD CONSTRAINT "end_file_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_file" ADD CONSTRAINT "end_file_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_message_reaction" ADD CONSTRAINT "group_message_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_message_reaction" ADD CONSTRAINT "group_message_reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "group_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_reaction" ADD CONSTRAINT "check_in_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_reaction" ADD CONSTRAINT "check_in_reaction_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_in"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_document" ADD CONSTRAINT "group_document_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_of_fame" ADD CONSTRAINT "hall_of_fame_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_recap" ADD CONSTRAINT "weekly_recap_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_badge" ADD CONSTRAINT "milestone_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confession_post" ADD CONSTRAINT "confession_post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confession_post" ADD CONSTRAINT "confession_post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confession_upvote" ADD CONSTRAINT "confession_upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confession_upvote" ADD CONSTRAINT "confession_upvote_confessionId_fkey" FOREIGN KEY ("confessionId") REFERENCES "confession_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption_task" ADD CONSTRAINT "redemption_task_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

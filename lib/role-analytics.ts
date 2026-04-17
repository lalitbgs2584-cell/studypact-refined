import { CheckInStatus, VerificationVerdict } from "@prisma/client";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getVoteSummary(
  verifications: Array<{
    verdict: VerificationVerdict;
  }>
) {
  const approvals = verifications.filter((verification) => verification.verdict === VerificationVerdict.APPROVE).length;
  const flags = verifications.filter((verification) => verification.verdict === VerificationVerdict.FLAG).length;

  return {
    approvals,
    flags,
    total: verifications.length,
  };
}

export function isConflictedSubmission(
  submission: {
    status: CheckInStatus;
    verifications: Array<{
      verdict: VerificationVerdict;
    }>;
  }
) {
  const votes = getVoteSummary(submission.verifications);

  return submission.status === CheckInStatus.FLAGGED || (votes.approvals > 0 && votes.flags > 0);
}

export function getValidatorAccuracy(
  verifications: Array<{
    verdict: VerificationVerdict;
    checkIn: {
      status: CheckInStatus;
    };
  }>
) {
  const finalized = verifications.filter(
    (verification) =>
      verification.checkIn.status === CheckInStatus.APPROVED ||
      verification.checkIn.status === CheckInStatus.REJECTED
  );

  if (finalized.length === 0) {
    return {
      correct: 0,
      total: 0,
      ratio: 0,
    };
  }

  const correct = finalized.filter((verification) => {
    if (verification.checkIn.status === CheckInStatus.APPROVED) {
      return verification.verdict === VerificationVerdict.APPROVE;
    }

    return verification.verdict === VerificationVerdict.FLAG;
  }).length;

  return {
    correct,
    total: finalized.length,
    ratio: correct / finalized.length,
  };
}

export function calculateTrustScore(input: {
  proofAccepted: number;
  proofRejected: number;
  correctVotes: number;
  totalVotes: number;
  completedTasks: number;
  missedTasks: number;
}) {
  const proofTotal = input.proofAccepted + input.proofRejected;
  const proofRate = proofTotal > 0 ? input.proofAccepted / proofTotal : 0.6;
  const voteRate = input.totalVotes > 0 ? input.correctVotes / input.totalVotes : 0.5;
  const completionTotal = input.completedTasks + input.missedTasks;
  const completionRate = completionTotal > 0 ? input.completedTasks / completionTotal : 0.5;

  const weighted =
    proofRate * 40 +
    voteRate * 35 +
    completionRate * 25;

  return Math.round(clamp(weighted, 0, 100));
}

export function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

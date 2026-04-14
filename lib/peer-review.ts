import { VerificationVerdict } from "@prisma/client";

export type PeerReviewVote = {
  verdict: VerificationVerdict;
};

export function getPeerReviewThreshold(totalEligibleReviewers: number) {
  return totalEligibleReviewers > 0 ? Math.floor(totalEligibleReviewers / 2) + 1 : 0;
}

export function getPeerReviewCounts(votes: PeerReviewVote[]) {
  const approvalVotes = votes.filter((vote) => vote.verdict === VerificationVerdict.APPROVE).length;
  const flagVotes = votes.length - approvalVotes;

  return {
    approvalVotes,
    flagVotes,
    totalVotes: votes.length,
  };
}

export function getPeerReviewMetrics(votes: PeerReviewVote[], totalEligibleReviewers: number) {
  const { approvalVotes, flagVotes, totalVotes } = getPeerReviewCounts(votes);
  const threshold = getPeerReviewThreshold(totalEligibleReviewers);

  return {
    approvalVotes,
    flagVotes,
    totalVotes,
    totalEligibleReviewers,
    threshold,
    approvalsRemaining: threshold > 0 ? Math.max(threshold - approvalVotes, 0) : 0,
    flagsRemaining: threshold > 0 ? Math.max(threshold - flagVotes, 0) : 0,
    approved: threshold > 0 && approvalVotes >= threshold,
    rejected: threshold > 0 && flagVotes >= threshold,
  };
}

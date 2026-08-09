import type { DashboardPost } from "../../components/candidate/candidate-dashboard-types";

export type CandidateDashboardFilter = "mine" | "open";

export type CandidateDashboardCursorParts = {
  agreeCount: number;
  createdAt: string;
  postId: string;
};

export type CandidateDashboardBootstrap = {
  status: "candidate_inactive" | "candidate_not_found" | "ok" | "onboarding_required";
  candidate?: {
    id: string;
    name: string;
    district: string;
    isActive: boolean;
    coverageVersion: number;
  };
  onboarding?: {
    hasFirstMessage: boolean;
    hasPendingFirstMessage: boolean;
  };
  firstMessage?: { id: string; content: string } | null;
  stats?: {
    totalTargeted: number;
    openPosts: number;
    repliedByMe: number;
    closedByOther: number;
    replyRate: number;
  };
  items?: DashboardPost[];
  nextCursorParts?: CandidateDashboardCursorParts | null;
  generatedAt?: string;
};

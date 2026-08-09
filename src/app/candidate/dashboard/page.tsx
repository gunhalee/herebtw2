import { redirect } from "next/navigation";
import {
  getCandidateSession,
  getVerifiedAuthClaims,
} from "../../../lib/auth/candidate-session";
import {
  loadDashboardStats,
  loadDistrictPosts,
  loadFirstMessage,
} from "../../../lib/posts/repository";
import { DashboardScreen } from "../../../components/candidate/dashboard-screen";
import {
  isCandidateInboxReadEnabled,
  isCandidateMfaRequired,
} from "../../../lib/candidate-dashboard/feature-flags";
import { loadCandidateDashboardBootstrapV2 } from "../../../lib/candidate-dashboard/repository";
import { encodeCandidateDashboardCursor } from "../../../lib/candidate-dashboard/cursor";
import type { CandidateDashboardFilter } from "../../../lib/candidate-dashboard/types";
import { createCandidateRequestTiming } from "../../../lib/candidate-dashboard/timing";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const timing = createCandidateRequestTiming("candidate.dashboard");
  if (isCandidateInboxReadEnabled()) {
    const claims = await getVerifiedAuthClaims();
    timing.mark("auth");
    if (!claims) {
      timing.finish("redirect_login");
      redirect("/auth/login");
    }
    if (isCandidateMfaRequired() && claims.assuranceLevel !== "aal2") {
      timing.finish("redirect_mfa");
      redirect("/auth/mfa");
    }
    const query = await searchParams;
    const filter: CandidateDashboardFilter = query.filter === "mine" ? "mine" : "open";
    const bootstrap = await loadCandidateDashboardBootstrapV2({
      authUserId: claims.authUserId,
      filter,
      limit: 20,
    });
    timing.mark("bootstrap");
    if (!bootstrap || bootstrap.status === "candidate_not_found") {
      timing.finish("redirect_login");
      redirect("/auth/login");
    }
    if (bootstrap.status === "onboarding_required") {
      timing.finish("redirect_onboarding");
      redirect("/candidate/onboarding");
    }
    if (bootstrap.status === "candidate_inactive" || !bootstrap.candidate) {
      timing.finish("candidate_inactive");
      throw new Error("Candidate dashboard is unavailable for an inactive candidate.");
    }
    const stats = bootstrap.stats ?? {
      totalTargeted: 0,
      openPosts: 0,
      repliedByMe: 0,
      closedByOther: 0,
      replyRate: 0,
    };
    const screen = (
      <DashboardScreen
        candidateName={bootstrap.candidate.name}
        district={bootstrap.candidate.district}
        posts={bootstrap.items ?? []}
        stats={{
          total_posts: stats.totalTargeted,
          replied_posts: stats.repliedByMe,
          unreplied_posts: stats.openPosts,
          reply_rate: stats.replyRate,
        }}
        firstMessage={bootstrap.firstMessage ?? null}
        firstMessagePending={bootstrap.onboarding?.hasPendingFirstMessage ?? false}
        filter={filter}
        nextCursor={encodeCandidateDashboardCursor(filter, bootstrap.nextCursorParts)}
      />
    );
    timing.finish("ok_v2");
    return screen;
  }

  const session = await getCandidateSession();
  timing.mark("auth_candidate");

  if (!session) {
    timing.finish("redirect_login");
    redirect("/auth/login");
  }

  if (isCandidateMfaRequired() && session.assuranceLevel !== "aal2") {
    timing.finish("redirect_mfa");
    redirect("/auth/mfa");
  }

  if (!session.hasFirstMessage && !session.hasPendingFirstMessage) {
    timing.finish("redirect_onboarding");
    redirect("/candidate/onboarding");
  }

  const [posts, stats, firstMessage] = await Promise.all([
    loadDistrictPosts(session.district, session.candidateId),
    loadDashboardStats(session.district),
    session.firstMessageId ? loadFirstMessage(session.firstMessageId) : null,
  ]);
  timing.mark("legacy_bootstrap");

  const screen = (
    <DashboardScreen
      candidateName={session.name}
      district={session.district}
      posts={posts}
      stats={stats}
      firstMessage={
        firstMessage
          ? { id: firstMessage.id, content: firstMessage.content }
          : null
      }
      firstMessagePending={session.hasPendingFirstMessage}
    />
  );
  timing.finish("ok_legacy");
  return screen;
}

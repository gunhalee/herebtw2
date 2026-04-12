import { redirect } from "next/navigation";
import { getCandidateSession } from "../../../lib/auth/candidate-session";
import {
  loadDashboardStats,
  loadDistrictPosts,
  loadFirstMessage,
} from "../../../lib/posts/repository";
import { DashboardScreen } from "../../../components/candidate/dashboard-screen";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCandidateSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.hasFirstMessage) {
    redirect("/candidate/onboarding");
  }

  const [posts, stats, firstMessage] = await Promise.all([
    loadDistrictPosts(session.district, session.candidateId),
    loadDashboardStats(session.district),
    session.firstMessageId ? loadFirstMessage(session.firstMessageId) : null,
  ]);

  return (
    <DashboardScreen
      candidateName={session.name}
      candidateId={session.candidateId}
      district={session.district}
      posts={posts}
      stats={stats}
      firstMessage={
        firstMessage
          ? { id: firstMessage.id, content: firstMessage.content }
          : null
      }
    />
  );
}

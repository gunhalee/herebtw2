import { redirect } from "next/navigation";
import { getCandidateSession } from "../../../lib/auth/candidate-session";
import { loadDashboardStats, loadDistrictPosts } from "../../../lib/posts/repository";
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

  const [posts, stats] = await Promise.all([
    loadDistrictPosts(session.district, session.candidateId),
    loadDashboardStats(session.district),
  ]);

  return (
    <DashboardScreen
      candidateName={session.name}
      candidateId={session.candidateId}
      district={session.district}
      posts={posts}
      stats={stats}
    />
  );
}

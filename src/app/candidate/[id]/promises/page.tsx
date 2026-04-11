import { notFound } from "next/navigation";
import {
  findCandidateById,
  loadCandidatePromises,
  loadDashboardStats,
  loadSetting,
} from "../../../../lib/posts/repository";
import { PromiseArchiveScreen } from "../../../../components/candidate/promise-archive-screen";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PromisesPage({ params }: PageProps) {
  const { id } = await params;

  const candidate = await findCandidateById(id);

  if (!candidate) {
    notFound();
  }

  const [promises, stats, electionDate] = await Promise.all([
    loadCandidatePromises(id),
    loadDashboardStats(candidate.district),
    loadSetting("election_date"),
  ]);

  return (
    <PromiseArchiveScreen
      candidate={{
        id: candidate.id,
        name: candidate.name,
        district: candidate.district,
      }}
      promises={promises}
      stats={{
        totalPosts: stats.total_posts,
        repliedPosts: stats.replied_posts,
        replyRate: stats.reply_rate,
        promiseCount: promises.length,
      }}
      electionDate={electionDate ?? "2026-06-03"}
    />
  );
}

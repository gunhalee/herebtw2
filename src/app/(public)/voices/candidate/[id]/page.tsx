import { notFound } from "next/navigation";
import { CandidateRepliesScreen } from "../../../../../components/candidate/candidate-replies-screen";
import { loadCandidateRepliesBootstrapRepository } from "../../../../../lib/posts/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateRepliesPage({ params }: PageProps) {
  const { id } = await params;

  const bootstrap = await loadCandidateRepliesBootstrapRepository({
    candidateId: id,
    limit: 10,
  });

  if (!bootstrap) {
    notFound();
  }

  return (
    <CandidateRepliesScreen
      candidateId={bootstrap.candidate.id}
      candidateMessageCard={bootstrap.candidateMessageCard}
      candidateName={bootstrap.candidate.name}
      initialState={bootstrap.postListState}
    />
  );
}

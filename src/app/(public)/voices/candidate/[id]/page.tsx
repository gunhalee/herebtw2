import { notFound } from "next/navigation";
import { CandidateRepliesScreen } from "../../../../../components/candidate/candidate-replies-screen";
import {
  findCandidateById,
  loadCandidateRepliesFeedRepository,
} from "../../../../../lib/posts/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateRepliesPage({ params }: PageProps) {
  const { id } = await params;

  const candidate = await findCandidateById(id);

  if (!candidate) {
    notFound();
  }

  const postListState = await loadCandidateRepliesFeedRepository({
    candidateId: id,
    limit: 10,
  });

  return (
    <CandidateRepliesScreen
      candidateId={candidate.id}
      candidateName={candidate.name}
      initialState={postListState}
    />
  );
}

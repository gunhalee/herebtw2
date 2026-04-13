import { notFound } from "next/navigation";
import { CandidateRepliesScreen } from "../../../../../components/candidate/candidate-replies-screen";
import { loadCandidateReplyHeaderCardForCandidate } from "../../../../../lib/candidates/reply-header-card";
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

  const [postListState, candidateMessageCard] = await Promise.all([
    loadCandidateRepliesFeedRepository({
      candidateId: id,
      limit: 10,
    }),
    loadCandidateReplyHeaderCardForCandidate(candidate),
  ]);

  return (
    <CandidateRepliesScreen
      candidateId={candidate.id}
      candidateMessageCard={candidateMessageCard}
      candidateName={candidate.name}
      initialState={postListState}
    />
  );
}

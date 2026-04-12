import type { CandidateMessage } from "../../lib/candidates/messages";
import type { PostListState } from "../../types/post";

export type SelectedCandidateRepliesPayload = {
  candidateId: string;
  candidateName: string;
  candidateMessageCard: CandidateMessage | null;
  initialState: PostListState;
};

import type { PostListState } from "../../types/post";

export type SelectedCandidateRepliesPayload = {
  candidateId: string;
  candidateName: string;
  initialState: PostListState;
};

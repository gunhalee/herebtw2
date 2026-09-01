export const CANDIDATE_REPLY_MAX_LENGTH = 2000;

export function isCandidateReplyLengthValid(content: string) {
  const length = content.trim().length;
  return length >= 1 && length <= CANDIDATE_REPLY_MAX_LENGTH;
}

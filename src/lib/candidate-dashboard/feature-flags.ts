function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function isCandidateInboxReadEnabled() {
  return isEnabled(process.env.CANDIDATE_INBOX_READ_ENABLED);
}

export function isCandidateAtomicReplyEnabled() {
  return isEnabled(process.env.CANDIDATE_ATOMIC_REPLY_ENABLED);
}

export function isReplyNotificationAsyncEnabled() {
  return isEnabled(process.env.REPLY_NOTIFICATION_ASYNC_ENABLED);
}

export function isCandidateMfaRequired() {
  return isEnabled(process.env.CANDIDATE_MFA_REQUIRED);
}

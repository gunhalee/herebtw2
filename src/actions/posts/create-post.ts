"use server";

import type { PostComposeState } from "../../types/post";
import { createPostDraft } from "../../lib/posts/mutations";

export async function createPostAction(
  state: PostComposeState,
  anonymousDeviceId?: string,
) {
  return createPostDraft(state, anonymousDeviceId);
}

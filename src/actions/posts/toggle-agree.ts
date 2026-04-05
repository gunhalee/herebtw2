"use server";

import type { PostDetailState } from "../../types/post";
import { toggleAgreeState } from "../../lib/posts/mutations";

export async function toggleAgreeAction(
  state: PostDetailState,
  anonymousDeviceId?: string,
) {
  return toggleAgreeState(state, state.postId, anonymousDeviceId);
}

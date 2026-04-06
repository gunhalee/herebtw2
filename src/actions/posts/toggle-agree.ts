"use server";

import { toggleAgreeState } from "../../lib/posts/mutations";

export async function toggleAgreeAction(
  postId: string,
  anonymousDeviceId?: string,
) {
  return toggleAgreeState(postId, anonymousDeviceId);
}

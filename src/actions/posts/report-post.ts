"use server";

import { reportPostRepository } from "../../lib/posts/repository";

export async function reportPostAction(
  postId: string,
  reasonCode: string,
  anonymousDeviceId?: string,
) {
  const result = await reportPostRepository(postId, reasonCode, anonymousDeviceId);

  return {
    ok: true,
    postId: result.postId,
    reasonCode: result.reasonCode,
  };
}

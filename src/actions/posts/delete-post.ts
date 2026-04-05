"use server";

import type { PostDetailState } from "../../types/post";
import { deletePostRepository } from "../../lib/posts/repository";

export async function deletePostAction(
  state: PostDetailState,
  anonymousDeviceId?: string,
) {
  if (!state.canDelete || state.deleteRemainingSeconds <= 0) {
    return {
      ok: false,
      errorMessage: "작성 후 3분이 지나 삭제할 수 없습니다.",
    };
  }

  await deletePostRepository(
    state.postId ?? "post_delete_mock",
    anonymousDeviceId,
  );

  return {
    ok: true,
    postId: state.postId,
  };
}

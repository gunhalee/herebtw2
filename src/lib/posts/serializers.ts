import type { PostDetailState, PostListItem } from "../../types/post";

export function serializePostListItem(item: PostListItem): PostListItem {
  return item;
}

export function serializePostDetailState(
  state: PostDetailState,
): PostDetailState {
  return state;
}

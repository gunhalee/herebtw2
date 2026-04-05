import type { AppShellState } from "../../types/device";
import type { PostDetailState, PostListState } from "../../types/post";
import { hasSupabaseServerConfig } from "../supabase/config";
import { serializePostDetailState, serializePostListItem } from "./serializers";
import { getMockPostDetailState } from "./mock-data";
import { loadPostDetailRepository, loadPostsListRepository } from "./repository";

export function getInitialAppShellState(
  anonymousDeviceId?: string | null,
): AppShellState {
  return {
    anonymousDeviceId: anonymousDeviceId ?? null,
    deviceReady: Boolean(anonymousDeviceId),
    permissionMode: "unknown",
    readOnlyMode: false,
    selectedDongCode: null,
    selectedDongName: null,
  };
}

export async function getHomePageState(): Promise<{
  appShellState: AppShellState;
  postListState: PostListState;
  postDetailState: PostDetailState;
}> {
  const appShellState = getInitialAppShellState();

  // In Supabase mode the client fetches the real list on mount, so we keep
  // the server render free of live data dependencies to avoid slow builds.
  if (hasSupabaseServerConfig()) {
    return {
      appShellState,
      postListState: {
        items: [],
        nextCursor: null,
        loading: true,
        loadingMore: false,
        empty: false,
        errorMessage: null,
        sort: "distance",
      },
      postDetailState: serializePostDetailState(getMockPostDetailState()),
    };
  }

  const postListState = await loadPostsListRepository({
    limit: 10,
  });
  const firstPostId = postListState.items[0]?.id ?? null;
  const fallbackDetail = firstPostId
    ? getMockPostDetailState(firstPostId)
    : getMockPostDetailState();
  const postDetailState = firstPostId
    ? (await loadPostDetailRepository({
        postId: firstPostId,
      })) ?? fallbackDetail
    : fallbackDetail;

  const serializedPostListState: PostListState = {
    ...postListState,
    items: postListState.items.map(serializePostListItem),
  };
  const serializedDetailState = serializePostDetailState(postDetailState);

  return {
    appShellState,
    postListState: serializedPostListState,
    postDetailState: serializedDetailState,
  };
}

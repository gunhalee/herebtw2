import { unstable_cache } from "next/cache";
import type { AppShellState } from "../../types/device";
import type { PostDetailState, PostListState } from "../../types/post";
import { hasSupabaseServerConfig } from "../supabase/config";
import { serializePostDetailState, serializePostListItem } from "./serializers";
import { getMockPostDetailState } from "./mock-data";
import {
  loadGlobalPostsListRepository,
  loadPostDetailRepository,
  loadPostsListRepository,
} from "./repository";

const loadCachedGlobalPostsList = unstable_cache(
  async () => loadGlobalPostsListRepository({ limit: 10 }),
  ["posts-global-feed"],
  {
    revalidate: 10,
    tags: ["posts-global-feed"],
  },
);

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

  if (hasSupabaseServerConfig()) {
    const postListState = await loadCachedGlobalPostsList();

    return {
      appShellState,
      postListState,
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

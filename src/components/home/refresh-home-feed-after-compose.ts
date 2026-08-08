import type { Dispatch, SetStateAction } from "react";
import type { PostListState, PostLocation } from "../../types/post";
import { fetchActiveHomeFeedPage } from "./home-feed-api";
import {
  buildPostListErrorState,
  buildReadyPostListState,
} from "./home-feed-state";

type RefreshHomeFeedAfterComposeInput = {
  anonymousDeviceId?: string;
  latestLocation: PostLocation | null;
  setFeedSortMode: Dispatch<SetStateAction<"nearby" | "global">>;
  setPostListState: Dispatch<SetStateAction<PostListState>>;
};

export async function refreshHomeFeedAfterCompose({
  anonymousDeviceId,
  latestLocation,
  setFeedSortMode,
  setPostListState,
}: RefreshHomeFeedAfterComposeInput) {
  try {
    const result = await fetchActiveHomeFeedPage(latestLocation, {
      anonymousDeviceId,
    });

    setFeedSortMode(result.feedSortMode);
    setPostListState((current) =>
      buildReadyPostListState(current, {
        items: result.data.items,
        nextCursor: result.data.nextCursor,
        sort: result.postSort,
      }),
    );
  } catch (error) {
    setPostListState((current) =>
      buildPostListErrorState(
        current,
        error instanceof Error
          ? error.message
          : "등록 후 목록을 새로고침하지 못했습니다.",
      ),
    );
  }
}

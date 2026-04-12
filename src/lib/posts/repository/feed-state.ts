import type { PostListState } from "../../../types/post";
import type { NearbyPostRow } from "./types";

function clampFeedLimit(limit?: number) {
  return Math.min(Math.max(limit ?? 10, 1), 50);
}

function sliceFeedRows<T>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;

  return {
    hasMore,
    selectedRows: hasMore ? rows.slice(0, limit) : rows,
  };
}

function createPostListState(input: {
  items: PostListState["items"];
  nextCursor: string | null;
  sort: PostListState["sort"];
}): PostListState {
  return {
    items: input.items,
    nextCursor: input.nextCursor,
    loading: false,
    loadingMore: false,
    empty: input.items.length === 0,
    errorMessage: null,
    sort: input.sort,
  };
}

function sliceNearbyRpcRows(
  rows: NearbyPostRow[],
  limit: number,
  filterReportedPosts: boolean,
) {
  const visibleRows = filterReportedPosts
    ? rows.filter((post) => post.can_report !== false)
    : rows;
  const hasMore =
    visibleRows.length > limit ||
    (rows.length > limit && visibleRows.length === limit);

  return {
    hasMore,
    selectedRows: hasMore ? visibleRows.slice(0, limit) : visibleRows,
  };
}

export {
  clampFeedLimit,
  createPostListState,
  sliceFeedRows,
  sliceNearbyRpcRows,
};

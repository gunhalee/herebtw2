import type { PostLocation } from "../../../types/post";
import type { FeedScope } from "./types";
import type { PostListCursor } from "./types";

type FeedMetricsContext = {
  scope: FeedScope;
  limit: number;
  hasCursor: boolean;
  hasViewerLocation: boolean;
  hasAnonymousDeviceId: boolean;
};

function buildFeedMetricsContext(input: {
  scope: FeedScope;
  anonymousDeviceId?: string;
  cursor: PostListCursor | null;
  limit: number;
  location?: PostLocation;
}): FeedMetricsContext {
  return {
    scope: input.scope,
    limit: input.limit,
    hasCursor: Boolean(input.cursor),
    hasViewerLocation: Boolean(input.location),
    hasAnonymousDeviceId: Boolean(input.anonymousDeviceId),
  };
}

function logFeedMetrics(
  level: "info" | "warn" | "error",
  event: string,
  payload: Record<string, unknown>,
) {
  const prefix = `[posts-feed] ${event}`;

  if (level === "warn") {
    console.warn(prefix, payload);
    return;
  }

  if (level === "error") {
    console.error(prefix, payload);
    return;
  }

  console.info(prefix, payload);
}

function logLoadedFeedMetrics(input: {
  metricsContext: FeedMetricsContext;
  path: "rpc";
  itemCount: number;
  hasMore: boolean;
  rpcDurationMs: number;
  totalDurationMs: number;
}) {
  logFeedMetrics("info", "load_posts_list", {
    ...input.metricsContext,
    path: input.path,
    itemCount: input.itemCount,
    hasMore: input.hasMore,
    rpcDurationMs: input.rpcDurationMs,
    totalDurationMs: input.totalDurationMs,
  });
}

export {
  buildFeedMetricsContext,
  logFeedMetrics,
  logLoadedFeedMetrics,
};
export type { FeedMetricsContext };

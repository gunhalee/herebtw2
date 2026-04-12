import type { PostLocation } from "../../../types/post";
import type { FeedFallbackReason, FeedScope, NearbyPostRow } from "./types";
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
  path: "rpc" | "legacy";
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

function logFeedFallbackMetrics(input: {
  metricsContext: FeedMetricsContext;
  fallbackReason: FeedFallbackReason;
  rpcDurationMs: number;
}) {
  logFeedMetrics("warn", "legacy_fallback", {
    ...input.metricsContext,
    fallbackReason: input.fallbackReason,
    rpcDurationMs: input.rpcDurationMs,
  });
}

function isFeedRpcRow(row: NearbyPostRow) {
  return (
    typeof row.agree_count === "number" &&
    typeof row.my_agree === "boolean" &&
    typeof row.can_report === "boolean"
  );
}

function getFeedRpcFallbackReason(
  rows: NearbyPostRow[] | null,
  fallbackReason: FeedFallbackReason | null,
) {
  return (
    fallbackReason ??
    (rows && rows.length > 0 && !isFeedRpcRow(rows[0]!)
      ? "unexpected_rpc_shape"
      : null)
  );
}

function shouldFallbackToLegacyFeedRpc(error: unknown) {
  return (
    error instanceof Error &&
    /list_posts_feed/i.test(error.message) &&
    /(404|Could not find the function|PGRST)/i.test(error.message)
  );
}

export {
  buildFeedMetricsContext,
  getFeedRpcFallbackReason,
  logFeedFallbackMetrics,
  logFeedMetrics,
  logLoadedFeedMetrics,
  shouldFallbackToLegacyFeedRpc,
};
export type { FeedMetricsContext };

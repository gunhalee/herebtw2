import { GLOBAL_FEED_DISTANCE_SENTINEL_METERS } from "../../geo/location-buckets";
import { supabaseSelect } from "../../supabase/rest";
import { formatRelativeTime } from "../../utils/datetime";
import type { PostListItem, PostListState } from "../../../types/post";
import type { PostEngagementRow } from "./types";
import { buildInFilter, isUuid } from "./shared";

const DEFAULT_REPLIES_PAGE_LIMIT = 10;
const MAX_REPLIES_PAGE_LIMIT = 50;

type CandidateRepliesCursor = {
  createdAt: string;
  replyId: string;
};

type CandidateReplyArchiveRow = {
  id: string;
  post_id: string;
  content: string;
  is_promise: boolean;
  created_at: string;
  post: {
    id: string;
    public_uuid: string;
    content: string;
    administrative_dong_name: string;
    status: string;
  } | null;
  candidate: {
    name: string;
    photo_url: string | null;
    local_council_district: string | null;
    council_type: string | null;
  } | null;
};

type CandidateReplyArchiveRowWithPost = CandidateReplyArchiveRow & {
  post: NonNullable<CandidateReplyArchiveRow["post"]>;
};

function hasActivePost(
  row: CandidateReplyArchiveRow,
): row is CandidateReplyArchiveRowWithPost {
  return Boolean(row.post && row.post.status === "active");
}

function clampRepliesLimit(limit?: number) {
  return Math.min(
    Math.max(limit ?? DEFAULT_REPLIES_PAGE_LIMIT, 1),
    MAX_REPLIES_PAGE_LIMIT,
  );
}

function encodeCandidateRepliesCursor(
  row: Pick<CandidateReplyArchiveRow, "id" | "created_at">,
) {
  const payload: CandidateRepliesCursor = {
    createdAt: row.created_at,
    replyId: row.id,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCandidateRepliesCursor(cursor: string | undefined) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<CandidateRepliesCursor>;

    if (
      typeof payload.createdAt !== "string" ||
      !payload.createdAt ||
      typeof payload.replyId !== "string" ||
      !isUuid(payload.replyId)
    ) {
      return null;
    }

    return payload as CandidateRepliesCursor;
  } catch {
    return null;
  }
}

function createCandidateRepliesCursorFilter(
  cursor: CandidateRepliesCursor | null,
) {
  if (!cursor) {
    return "";
  }

  const encodedCreatedAt = encodeURIComponent(cursor.createdAt);

  return `&or=(created_at.lt.${encodedCreatedAt},and(created_at.eq.${encodedCreatedAt},id.gt.${cursor.replyId}))`;
}

function getNextCandidateRepliesCursor(
  rows: CandidateReplyArchiveRowWithPost[],
  hasMore: boolean,
) {
  if (!hasMore || rows.length === 0) {
    return null;
  }

  return encodeCandidateRepliesCursor(rows[rows.length - 1]!);
}

function createEmptyCandidateRepliesState(): PostListState {
  return {
    items: [],
    nextCursor: null,
    loading: false,
    loadingMore: false,
    empty: true,
    errorMessage: null,
    sort: "latest",
  };
}

async function loadCandidateRepliesFeedRepository(input: {
  candidateId: string;
  limit?: number;
  cursor?: string;
}): Promise<PostListState> {
  const limit = clampRepliesLimit(input.limit);
  const cursor = decodeCandidateRepliesCursor(input.cursor);
  const cursorFilter = createCandidateRepliesCursorFilter(cursor);

  const replyRows = await supabaseSelect<CandidateReplyArchiveRow[]>(
    `replies?select=id,post_id,content,is_promise,created_at,post:posts!inner(id,public_uuid,content,administrative_dong_name,status),candidate:candidates!inner(name,photo_url,local_council_district,council_type)&candidate_id=eq.${input.candidateId}&post.status=eq.active&order=created_at.desc&order=id.asc&limit=${limit + 1}${cursorFilter}`,
  );

  if (!replyRows || replyRows.length === 0) {
    return createEmptyCandidateRepliesState();
  }

  const activeRows = replyRows.filter(hasActivePost);
  const hasMore = activeRows.length > limit;
  const selectedRows = hasMore ? activeRows.slice(0, limit) : activeRows;
  const postIds = selectedRows.map((row) => row.post.id);

  if (postIds.length === 0) {
    return createEmptyCandidateRepliesState();
  }

  const engagementRows =
    (await supabaseSelect<PostEngagementRow[]>(
      `post_engagement_view?select=post_id,agree_count&post_id=in.(${buildInFilter(postIds)})`,
    )) ?? [];
  const engagementMap = new Map(
    engagementRows.map((row) => [row.post_id, Number(row.agree_count)]),
  );

  const items: PostListItem[] = selectedRows.map((row) => ({
    id: row.post.id,
    publicUuid: row.post.public_uuid,
    content: row.post.content,
    administrativeDongName: row.post.administrative_dong_name,
    distanceMeters: GLOBAL_FEED_DISTANCE_SENTINEL_METERS,
    relativeTime: formatRelativeTime(row.created_at),
    agreeCount: engagementMap.get(row.post.id) ?? 0,
    myAgree: false,
    canReport: false,
    isHighlighted: false,
    replyStatus: "replied",
    replyCandidateName: row.candidate?.name ?? null,
    replyCandidatePhotoUrl: row.candidate?.photo_url ?? null,
    replyCandidateLocalCouncilDistrict:
      row.candidate?.local_council_district ?? null,
    replyCandidateCouncilType: row.candidate?.council_type ?? null,
    replyContent: row.content,
    replyIsPromise: row.is_promise,
  }));

  return {
    items,
    nextCursor: getNextCandidateRepliesCursor(selectedRows, hasMore),
    loading: false,
    loadingMore: false,
    empty: items.length === 0,
    errorMessage: null,
    sort: "latest",
  };
}

export { loadCandidateRepliesFeedRepository };

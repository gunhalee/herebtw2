import { GLOBAL_FEED_DISTANCE_SENTINEL_METERS } from "../../geo/location-buckets";
import type { CandidateMessage } from "../../candidates/messages";
import { supabaseRpc } from "../../supabase/rest";
import { formatRelativeTime } from "../../utils/datetime";
import type { PostListItem, PostListState } from "../../../types/post";
import { isUuid } from "./shared";

const DEFAULT_REPLIES_PAGE_LIMIT = 10;
const MAX_REPLIES_PAGE_LIMIT = 50;

type CandidateRepliesCursor = {
  createdAt: string;
  replyId: string;
};

type CandidateRepliesBootstrapCandidate = {
  id: string;
  name: string;
  district: string;
  photoUrl: string | null;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
  councilType: string | null;
};

type CandidateRepliesBootstrapItem = {
  postId: string;
  publicUuid: string;
  content: string;
  administrativeDongName: string;
  agreeCount: number;
  replyCandidateName: string | null;
  replyCandidatePhotoUrl: string | null;
  replyCandidateLocalCouncilDistrict: string | null;
  replyCandidateCouncilType: string | null;
  replyContent: string | null;
  replyCreatedAt: string;
  replyIsPromise: boolean | null;
};

type CandidateRepliesBootstrapPayload = {
  candidate: CandidateRepliesBootstrapCandidate;
  candidateMessageCard: CandidateMessage | null;
  items: CandidateRepliesBootstrapItem[];
  nextCursor: CandidateRepliesCursor | null;
};

type CandidateRepliesBootstrapRepositoryResult = {
  candidate: CandidateRepliesBootstrapCandidate;
  candidateMessageCard: CandidateMessage | null;
  postListState: PostListState;
};

function clampRepliesLimit(limit?: number) {
  return Math.min(
    Math.max(limit ?? DEFAULT_REPLIES_PAGE_LIMIT, 1),
    MAX_REPLIES_PAGE_LIMIT,
  );
}

function encodeCandidateRepliesCursor(cursor: CandidateRepliesCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
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

function buildCandidateRepliesState(
  payload: CandidateRepliesBootstrapPayload,
): PostListState {
  const items: PostListItem[] = payload.items.map((item) => ({
    id: item.postId,
    publicUuid: item.publicUuid,
    content: item.content,
    administrativeDongName: item.administrativeDongName,
    distanceMeters: GLOBAL_FEED_DISTANCE_SENTINEL_METERS,
    relativeTime: formatRelativeTime(item.replyCreatedAt),
    agreeCount: Number(item.agreeCount) || 0,
    myAgree: false,
    canReport: false,
    isHighlighted: false,
    replyStatus: "replied",
    replyCandidateName: item.replyCandidateName,
    replyCandidatePhotoUrl: item.replyCandidatePhotoUrl,
    replyCandidateLocalCouncilDistrict: item.replyCandidateLocalCouncilDistrict,
    replyCandidateCouncilType: item.replyCandidateCouncilType,
    replyContent: item.replyContent,
    replyIsPromise: item.replyIsPromise,
  }));

  return {
    items,
    nextCursor: payload.nextCursor
      ? encodeCandidateRepliesCursor(payload.nextCursor)
      : null,
    loading: false,
    loadingMore: false,
    empty: items.length === 0,
    errorMessage: null,
    sort: "latest",
  };
}

async function loadCandidateRepliesBootstrapRpc(input: {
  candidateId: string;
  limit?: number;
  cursor?: string;
}) {
  if (!isUuid(input.candidateId)) {
    return null;
  }

  const limit = clampRepliesLimit(input.limit);
  const cursor = decodeCandidateRepliesCursor(input.cursor);

  return supabaseRpc<CandidateRepliesBootstrapPayload | null>(
    "get_candidate_replies_bootstrap",
    {
      target_candidate_id: input.candidateId,
      result_limit: limit,
      cursor_reply_created_at: cursor?.createdAt ?? null,
      cursor_reply_id: cursor?.replyId ?? null,
    },
  );
}

async function loadCandidateRepliesBootstrapRepository(input: {
  candidateId: string;
  limit?: number;
  cursor?: string;
}): Promise<CandidateRepliesBootstrapRepositoryResult | null> {
  const payload = await loadCandidateRepliesBootstrapRpc(input);

  if (!payload?.candidate) {
    return null;
  }

  return {
    candidate: payload.candidate,
    candidateMessageCard: payload.candidateMessageCard,
    postListState: buildCandidateRepliesState(payload),
  };
}

async function loadCandidateRepliesFeedRepository(input: {
  candidateId: string;
  limit?: number;
  cursor?: string;
}): Promise<PostListState> {
  const payload = await loadCandidateRepliesBootstrapRpc(input);

  if (!payload?.candidate) {
    return createEmptyCandidateRepliesState();
  }

  return buildCandidateRepliesState(payload);
}

export {
  loadCandidateRepliesBootstrapRepository,
  loadCandidateRepliesFeedRepository,
};

import type { PostListState } from "../../../types/post";
import { formatRelativeTime } from "../../utils/datetime";
import type { NearbyPostRow } from "./types";

function buildRpcPostListItems(
  posts: NearbyPostRow[],
  options?: {
    myAgree?: boolean;
    canReport?: boolean;
    fallbackCanReport?: boolean;
    distanceMetersOverride?: number;
  },
) {
  return posts.map((post) => ({
    id: post.id,
    content: post.content,
    administrativeDongName: post.administrative_dong_name,
    distanceMeters: options?.distanceMetersOverride ?? post.distance_meters,
    relativeTime: formatRelativeTime(post.created_at),
    agreeCount: post.agree_count ?? 0,
    myAgree: options?.myAgree ?? post.my_agree ?? false,
    canReport:
      options?.canReport ??
      post.can_report ??
      options?.fallbackCanReport ??
      true,
    isHighlighted: false,
    replyStatus:
      post.reply_status === "replied"
        ? ("replied" as const)
        : post.reply_status === "delivered"
          ? ("delivered" as const)
          : undefined,
    replyCandidateName: post.reply_candidate_name ?? null,
    replyCandidatePhotoUrl: post.reply_candidate_photo_url ?? null,
    replyCandidateLocalCouncilDistrict:
      post.reply_candidate_local_council_district ?? null,
    replyCandidateCouncilType: post.reply_candidate_council_type ?? null,
    replyContent: post.reply_content ?? null,
    replyIsPromise: post.reply_is_promise ?? null,
  })) satisfies PostListState["items"];
}

export { buildRpcPostListItems };

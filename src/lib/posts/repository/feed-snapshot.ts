import { hasSupabaseServerConfig } from "../../supabase/config";
import { supabaseSelect } from "../../supabase/rest";
import { getMockPostListState } from "../mock-data";
import { buildInFilter, ensureDeviceIdentity, isUuid } from "./shared";
import type { PostEngagementRow, ReactionRow, ReportRow } from "./types";

async function loadEngagementRows(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }

  return (
    (await supabaseSelect<PostEngagementRow[]>(
      `post_engagement_view?select=post_id,agree_count&post_id=in.(${buildInFilter(postIds)})`,
    )) ?? []
  );
}

async function loadMyAgreeRows(deviceId: string | undefined, postIds: string[]) {
  if (!deviceId || postIds.length === 0) {
    return [];
  }

  return (
    (await supabaseSelect<ReactionRow[]>(
      `post_reactions?select=id,post_id,device_id,reaction_type&device_id=eq.${deviceId}&reaction_type=eq.agree&post_id=in.(${buildInFilter(postIds)})`,
    )) ?? []
  );
}

async function loadMyReportRows(deviceId: string | undefined, postIds: string[]) {
  if (!deviceId || postIds.length === 0) {
    return [];
  }

  return (
    (await supabaseSelect<ReportRow[]>(
      `post_reports?select=id,post_id,reporter_device_id,reason_code&reporter_device_id=eq.${deviceId}&post_id=in.(${buildInFilter(postIds)})`,
    )) ?? []
  );
}

async function loadPostEngagementSnapshotRepository(input: {
  anonymousDeviceId?: string;
  postIds?: string[];
}) {
  const requestedPostIds = Array.from(
    new Set((input.postIds ?? []).filter((postId) => isUuid(postId))),
  ).slice(0, 50);

  if (requestedPostIds.length === 0) {
    return {
      items: [] as Array<{
        id: string;
        agreeCount: number;
        myAgree: boolean;
      }>,
    };
  }

  if (!hasSupabaseServerConfig()) {
    const itemMap = new Map(
      getMockPostListState().items.map((item) => [item.id, item]),
    );

    return {
      items: requestedPostIds
        .map((postId) => {
          const item = itemMap.get(postId);

          if (!item) {
            return null;
          }

          return {
            id: postId,
            agreeCount: item.agreeCount,
            myAgree: item.myAgree,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    };
  }

  const device = input.anonymousDeviceId
    ? await ensureDeviceIdentity(input.anonymousDeviceId)
    : null;
  const [engagementRows, myReactionRows] = await Promise.all([
    loadEngagementRows(requestedPostIds),
    loadMyAgreeRows(device?.id, requestedPostIds),
  ]);
  const engagementMap = new Map(
    engagementRows.map((row) => [row.post_id, Number(row.agree_count)]),
  );
  const myAgreeSet = new Set(myReactionRows.map((row) => row.post_id));

  return {
    items: requestedPostIds.map((postId) => ({
      id: postId,
      agreeCount: engagementMap.get(postId) ?? 0,
      myAgree: myAgreeSet.has(postId),
    })),
  };
}

export {
  loadEngagementRows,
  loadMyAgreeRows,
  loadMyReportRows,
  loadPostEngagementSnapshotRepository,
};

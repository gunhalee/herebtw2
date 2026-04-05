import type { AppShellState } from "../../types/device";
import type { GridCellSummary } from "../../types/grid";
import type { PostComposeState, PostDetailState, PostListState } from "../../types/post";
import { getSupabaseServerClient } from "../supabase/server";
import {
  supabaseDelete,
  supabaseInsert,
  supabaseRpc,
  supabaseSelect,
  supabaseUpsert,
} from "../supabase/rest";
import { makeOpaqueCursor } from "../utils/cursor";
import { formatRelativeTime } from "../utils/datetime";
import { hydrateGridCells } from "../geo/region-metadata";
import {
  getMockGridSummary,
  getMockAppShellState,
  getMockGridCells,
  getMockPostDetailState,
  getMockPostListState,
  toggleMockPostAgree,
} from "./mock-data";

export type HomePageRepositoryResult = {
  appShellState: AppShellState;
  gridCells: GridCellSummary[];
  postListState: PostListState;
  postDetailState: PostDetailState;
};

export async function loadHomePageRepository(): Promise<HomePageRepositoryResult> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    const appShellState = getMockAppShellState();
    return {
      appShellState,
      gridCells: getMockGridCells(appShellState),
      postListState: getMockPostListState(),
      postDetailState: getMockPostDetailState(),
    };
  }

  const appShellState = getMockAppShellState();

  return {
    appShellState,
    gridCells: getMockGridCells(appShellState),
    postListState: getMockPostListState(),
    postDetailState: getMockPostDetailState(),
  };
}

type DeviceIdentityRow = {
  id: string;
  anonymous_device_id: string;
};

type PostRow = {
  id: string;
  content: string;
  administrative_dong_name: string;
  author_device_id?: string;
  grid_cell_path?: string;
  created_at: string;
  delete_expires_at: string;
};

function estimateDistanceMeters(post: Pick<PostRow, "grid_cell_path" | "administrative_dong_name">, index: number) {
  const seedByPath: Record<string, number> = {
    "nation.seoul.gangnam.yeoksam1": 280,
    "nation.seoul.gangnam.yeoksam2": 610,
    "nation.seoul.gangnam.nonhyeon1": 820,
    "nation.seoul.mapo.seogyo": 1240,
    "nation.seoul.mapo.yeonnam": 1580,
    "nation.incheon.yeonsu.songdo1": 2350,
  };

  return seedByPath[post.grid_cell_path ?? ""] ?? 420 + index * 180;
}

type PostEngagementRow = {
  post_id: string;
  agree_count: number;
};

type ReactionRow = {
  id: string;
  post_id: string;
  device_id: string;
  reaction_type: string;
};

async function ensureDeviceIdentity(anonymousDeviceId: string) {
  const rows = await supabaseUpsert<DeviceIdentityRow[]>(
    "device_identities?on_conflict=anonymous_device_id&select=id,anonymous_device_id",
    {
      anonymous_device_id: anonymousDeviceId,
    },
  );

  return rows?.[0] ?? null;
}

function buildInFilter(values: string[]) {
  return values.map((value) => `"${value}"`).join(",");
}

function getColorLevel(activePostCount: number) {
  if (activePostCount >= 10) {
    return 3;
  }

  if (activePostCount >= 3) {
    return 2;
  }

  if (activePostCount >= 1) {
    return 1;
  }

  return 0;
}

export async function loadGridSummaryRepository(input: {
  gridCellPaths: string[];
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return getMockGridSummary(input.gridCellPaths).map((cell) => ({
      ...cell,
      colorLevel: getColorLevel(cell.activePostCount),
    }));
  }

  return Promise.all(
    input.gridCellPaths.map(async (gridCellPath) => {
      const rows = await supabaseSelect<PostRow[]>(
        `posts?select=id&status=eq.active&grid_cell_path=like.${gridCellPath}*`,
      );
      const activePostCount = rows?.length ?? 0;

      return {
        gridCellPath,
        activePostCount,
        colorLevel: getColorLevel(activePostCount),
      };
    }),
  );
}

export async function loadRegionGridRepository(
  appShellState: Pick<AppShellState, "selectedGridLevel" | "selectedGridCellPath">,
) {
  const metadataCells = getMockGridCells(appShellState);
  const summary = await loadGridSummaryRepository({
    gridCellPaths: metadataCells.map((cell) => cell.gridCellPath),
  });

  return hydrateGridCells(appShellState, summary);
}

export async function loadPostsListRepository(input: {
  anonymousDeviceId?: string;
  limit?: number;
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return getMockPostListState();
  }

  const device = input.anonymousDeviceId
    ? await ensureDeviceIdentity(input.anonymousDeviceId)
    : null;
  const limit = input.limit ?? 10;
  const query = [
    "select=id,content,administrative_dong_name,created_at,delete_expires_at,grid_cell_path",
    "status=eq.active",
    "order=created_at.desc",
    `limit=${limit}`,
  ];

  const posts = (await supabaseSelect<PostRow[]>(`posts?${query.join("&")}`)) ?? [];
  const postIds = posts.map((post) => post.id);

  const engagementRows =
    postIds.length > 0
      ? ((await supabaseSelect<PostEngagementRow[]>(
          `post_engagement_view?select=post_id,agree_count&post_id=in.(${buildInFilter(postIds)})`,
        )) ?? [])
      : [];

  const myReactionRows =
    device && postIds.length > 0
      ? ((await supabaseSelect<ReactionRow[]>(
          `post_reactions?select=id,post_id,device_id,reaction_type&device_id=eq.${device.id}&reaction_type=eq.agree&post_id=in.(${buildInFilter(postIds)})`,
        )) ?? [])
      : [];

  const engagementMap = new Map(
    engagementRows.map((row) => [row.post_id, Number(row.agree_count)]),
  );
  const myReactionSet = new Set(myReactionRows.map((row) => row.post_id));

  const items = posts
    .map((post, index) => ({
      id: post.id,
      content: post.content,
      administrativeDongName: post.administrative_dong_name,
      distanceMeters: estimateDistanceMeters(post, index),
      relativeTime: formatRelativeTime(post.created_at),
      agreeCount: engagementMap.get(post.id) ?? 0,
      myAgree: myReactionSet.has(post.id),
      canReport: true,
      isHighlighted: false,
    }))
    .sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }

      return 0;
    });

  const lastPost = posts[posts.length - 1];

  return {
    items,
    nextCursor: lastPost
      ? makeOpaqueCursor({
          createdAt: lastPost.created_at,
          id: lastPost.id,
        })
      : null,
    loading: false,
    loadingMore: false,
    empty: items.length === 0,
    errorMessage: null,
    sort: "distance" as const,
  };
}

export async function loadPostDetailRepository(input: {
  postId: string;
  anonymousDeviceId?: string;
}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    const mock = getMockPostDetailState(input.postId);
    return input.postId === mock.postId ? mock : null;
  }

  const device = input.anonymousDeviceId
    ? await ensureDeviceIdentity(input.anonymousDeviceId)
    : null;
  const postRows =
    (await supabaseSelect<PostRow[]>(
      `posts?select=id,content,administrative_dong_name,created_at,delete_expires_at,author_device_id&status=eq.active&id=eq.${input.postId}&limit=1`,
    )) ?? [];
  const post = postRows[0];

  if (!post) {
    return null;
  }

  const engagementRows =
    (await supabaseSelect<PostEngagementRow[]>(
      `post_engagement_view?select=post_id,agree_count&post_id=eq.${post.id}`,
    )) ?? [];
  const myReactionRows =
    device
      ? ((await supabaseSelect<ReactionRow[]>(
          `post_reactions?select=id,post_id,device_id,reaction_type&device_id=eq.${device.id}&reaction_type=eq.agree&post_id=eq.${post.id}`,
        )) ?? [])
      : [];

  const deleteRemainingSeconds = Math.max(
    0,
    Math.floor(
      (new Date(post.delete_expires_at).getTime() - Date.now()) / 1000,
    ),
  );

  return {
    postId: post.id,
    open: true,
    loading: false,
    content: post.content,
    administrativeDongName: post.administrative_dong_name,
    distanceMeters: estimateDistanceMeters(post, 0),
    relativeTime: formatRelativeTime(post.created_at),
    agreeCount: Number(engagementRows[0]?.agree_count ?? 0),
    myAgree: myReactionRows.length > 0,
    canReport: true,
    canDelete: deleteRemainingSeconds > 0,
    deleteRemainingSeconds,
    errorMessage: null,
  };
}

export async function syncDeviceRepository(anonymousDeviceId: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      device: {
        id: "device_uuid_mock",
        anonymous_device_id: anonymousDeviceId,
      },
    };
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  return {
    mode: "supabase" as const,
    device,
  };
}

export async function createPostRepository(
  state: PostComposeState,
  anonymousDeviceId?: string,
) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !anonymousDeviceId) {
    return {
      mode: "mock" as const,
      state,
    };
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  const rows = await supabaseInsert<PostRow[]>(
    "posts?select=id,content,administrative_dong_name,created_at,delete_expires_at",
    {
      author_device_id: device.id,
      content: state.content.trim(),
      administrative_dong_name: state.resolvedDongName,
      administrative_dong_code: state.resolvedDongCode,
      grid_cell_path: state.resolvedGridCellPath,
    },
  );

  return {
    mode: "supabase" as const,
    state,
    post: rows?.[0] ?? null,
  };
}

export async function toggleAgreeRepository(
  postId: string,
  anonymousDeviceId?: string,
) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !anonymousDeviceId) {
    return {
      mode: "mock" as const,
      ...toggleMockPostAgree(postId),
    };
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  const existingRows = await supabaseSelect<ReactionRow[]>(
    `post_reactions?select=id,post_id,device_id,reaction_type&post_id=eq.${postId}&device_id=eq.${device.id}&reaction_type=eq.agree`,
  );

  if (existingRows && existingRows.length > 0) {
    await supabaseDelete<ReactionRow[]>(
      `post_reactions?id=eq.${existingRows[0].id}&select=id`,
    );

    const engagementRows =
      (await supabaseSelect<PostEngagementRow[]>(
        `post_engagement_view?select=post_id,agree_count&post_id=eq.${postId}`,
      )) ?? [];

    return {
      mode: "supabase" as const,
      postId,
      agreed: false,
      agreeCount: Number(engagementRows[0]?.agree_count ?? 0),
    };
  }

  await supabaseInsert<ReactionRow[]>(
    "post_reactions?select=id,post_id,device_id,reaction_type",
    {
      post_id: postId,
      device_id: device.id,
      reaction_type: "agree",
    },
  );

  const engagementRows =
    (await supabaseSelect<PostEngagementRow[]>(
      `post_engagement_view?select=post_id,agree_count&post_id=eq.${postId}`,
    )) ?? [];

  return {
    mode: "supabase" as const,
    postId,
    agreed: true,
    agreeCount: Number(engagementRows[0]?.agree_count ?? 0),
  };
}

export async function deletePostRepository(
  postId: string,
  anonymousDeviceId?: string,
) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !anonymousDeviceId) {
    return {
      mode: "mock" as const,
      postId,
    };
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  const deletedPost = await supabaseRpc<PostRow>("soft_delete_post", {
    target_post_id: postId,
    requester_device_id: device.id,
  });

  return {
    mode: "supabase" as const,
    postId,
    deletedPost,
  };
}

export async function reportPostRepository(
  postId: string,
  reasonCode: string,
  anonymousDeviceId?: string,
) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !anonymousDeviceId) {
    return {
      mode: "mock" as const,
      postId,
      reasonCode,
    };
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  await supabaseInsert(
    "post_reports?select=id,post_id,reporter_device_id,reason_code",
    {
      post_id: postId,
      reporter_device_id: device.id,
      reason_code: reasonCode,
    },
  );

  return {
    mode: "supabase" as const,
    postId,
    reasonCode,
  };
}

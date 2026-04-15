import { unstable_cache } from "next/cache";
import type { CandidateMessagesPayload } from "../candidates/messages";
import type { AppShellState } from "../../types/device";
import type { PostListState } from "../../types/post";
import { loadGlobalPostsListRepository } from "./repository";

const HOME_SHELL_FEED_LIMIT = 5;

const loadCachedGlobalPostsList = unstable_cache(
  async () => loadGlobalPostsListRepository({ limit: HOME_SHELL_FEED_LIMIT }),
  ["posts-global-feed"],
  {
    revalidate: 10,
    tags: ["posts-global-feed"],
  },
);

export type HomePageState = {
  appShellState: AppShellState;
  candidateMessages: CandidateMessagesPayload | null;
  postListState: PostListState;
};

export type PublicHomePageShellState = {
  currentDongName: string | null;
  selectedDongCode: string | null;
  candidateMessages: CandidateMessagesPayload | null;
  postListState: PostListState;
};

function getInitialAppShellState(
  options?: {
    anonymousDeviceId?: string | null;
  },
): AppShellState {
  return {
    anonymousDeviceId: options?.anonymousDeviceId ?? null,
    deviceReady: Boolean(options?.anonymousDeviceId),
    permissionMode: "unknown",
    readOnlyMode: false,
    selectedDongCode: null,
    selectedDongName: null,
  };
}

export async function getHomePageState(): Promise<HomePageState> {
  const [appShellState, postListState] = await Promise.all([
    Promise.resolve(getInitialAppShellState()),
    loadCachedGlobalPostsList(),
  ]);

  return {
    appShellState,
    candidateMessages: null,
    postListState,
  };
}

export async function getInteractiveHomeBootstrapState(): Promise<HomePageState> {
  const postListState = await loadCachedGlobalPostsList();

  return {
    appShellState: getInitialAppShellState(),
    candidateMessages: null,
    postListState,
  };
}

export async function getPublicHomePageShellState(): Promise<PublicHomePageShellState> {
  const postListState = await loadCachedGlobalPostsList();
  return {
    currentDongName: null,
    selectedDongCode: null,
    candidateMessages: null,
    postListState,
  };
}

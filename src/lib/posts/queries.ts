import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import type { CandidateMessagesPayload } from "../candidates/messages";
import { loadCandidateMessages } from "../candidates/messages";
import {
  SELECTED_DONG_CODE_COOKIE_KEY,
  SELECTED_DONG_NAME_COOKIE_KEY,
} from "../geo/administrative-location-cookie";
import type { AppShellState } from "../../types/device";
import type { PostListState } from "../../types/post";
import { loadGlobalPostsListRepository } from "./repository";

const ANONYMOUS_DEVICE_COOKIE_KEY = "shout_anonymous_device_id";
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
    selectedDongCode?: string | null;
    selectedDongName?: string | null;
  },
): AppShellState {
  return {
    anonymousDeviceId: options?.anonymousDeviceId ?? null,
    deviceReady: Boolean(options?.anonymousDeviceId),
    permissionMode: "unknown",
    readOnlyMode: false,
    selectedDongCode: options?.selectedDongCode ?? null,
    selectedDongName: options?.selectedDongName ?? null,
  };
}

async function readDeviceCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(ANONYMOUS_DEVICE_COOKIE_KEY)?.value;
    if (!raw) return null;
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

async function readAdministrativeLocationCookies(): Promise<{
  selectedDongCode: string | null;
  selectedDongName: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const rawDongCode = cookieStore.get(SELECTED_DONG_CODE_COOKIE_KEY)?.value;
    const rawDongName = cookieStore.get(SELECTED_DONG_NAME_COOKIE_KEY)?.value;

    const selectedDongCode = rawDongCode ? decodeURIComponent(rawDongCode).trim() : null;
    const selectedDongName = rawDongName ? decodeURIComponent(rawDongName).trim() : null;

    return {
      selectedDongCode: selectedDongCode || null,
      selectedDongName: selectedDongName || null,
    };
  } catch {
    return {
      selectedDongCode: null,
      selectedDongName: null,
    };
  }
}

export async function getHomePageState(): Promise<HomePageState> {
  const [anonymousDeviceId, administrativeLocation] = await Promise.all([
    readDeviceCookie(),
    readAdministrativeLocationCookies(),
  ]);
  const appShellState = getInitialAppShellState({
    anonymousDeviceId,
    selectedDongCode: administrativeLocation.selectedDongCode,
    selectedDongName: administrativeLocation.selectedDongName,
  });
  const [postListState, candidateMessages] = await Promise.all([
    loadCachedGlobalPostsList(),
    administrativeLocation.selectedDongCode
      ? loadCandidateMessages(administrativeLocation.selectedDongCode).catch(
          () => null,
        )
      : Promise.resolve(null),
  ]);

  return {
    appShellState,
    candidateMessages,
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

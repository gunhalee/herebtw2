import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import type { CandidateMessagesPayload } from "../candidates/messages";
import { loadCandidateMessages } from "../candidates/messages";
import { loadCandidateReplyHeaderCardForCandidate } from "../candidates/reply-header-card";
import type { SelectedCandidateRepliesPayload } from "../../components/candidate/candidate-replies-types";
import {
  SELECTED_DONG_CODE_COOKIE_KEY,
  SELECTED_DONG_NAME_COOKIE_KEY,
} from "../geo/administrative-location-cookie";
import type { AppShellState } from "../../types/device";
import type { PostListState } from "../../types/post";
import {
  findCandidateById,
  loadGlobalPostsListRepository,
  loadCandidateRepliesFeedRepository,
} from "./repository";

const ANONYMOUS_DEVICE_COOKIE_KEY = "shout_anonymous_device_id";

const loadCachedGlobalPostsList = unstable_cache(
  async () => loadGlobalPostsListRepository({ limit: 10 }),
  ["posts-global-feed"],
  {
    revalidate: 10,
    tags: ["posts-global-feed"],
  },
);

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

export async function getHomePageState(options?: {
  candidateId?: string | null;
}): Promise<{
  appShellState: AppShellState;
  candidateMessages: CandidateMessagesPayload | null;
  postListState: PostListState;
  selectedCandidateReplies: SelectedCandidateRepliesPayload | null;
}> {
  const [anonymousDeviceId, administrativeLocation] = await Promise.all([
    readDeviceCookie(),
    readAdministrativeLocationCookies(),
  ]);
  const appShellState = getInitialAppShellState({
    anonymousDeviceId,
    selectedDongCode: administrativeLocation.selectedDongCode,
    selectedDongName: administrativeLocation.selectedDongName,
  });
  const [postListState, candidateMessages, selectedCandidateReplies] =
    await Promise.all([
      loadCachedGlobalPostsList(),
      administrativeLocation.selectedDongCode
        ? loadCandidateMessages(administrativeLocation.selectedDongCode).catch(
            () => null,
          )
        : Promise.resolve(null),
      loadSelectedCandidateReplies(options?.candidateId ?? null),
  ]);

  return {
    appShellState,
    candidateMessages,
    postListState,
    selectedCandidateReplies,
  };
}

async function loadSelectedCandidateReplies(
  candidateId: string | null,
): Promise<SelectedCandidateRepliesPayload | null> {
  if (!candidateId) {
    return null;
  }

  const candidate = await findCandidateById(candidateId);

  if (!candidate) {
    return null;
  }

  const [initialState, candidateMessageCard] = await Promise.all([
    loadCandidateRepliesFeedRepository({
      candidateId: candidate.id,
      limit: 10,
    }),
    loadCandidateReplyHeaderCardForCandidate(candidate),
  ]);

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateMessageCard,
    initialState,
  };
}

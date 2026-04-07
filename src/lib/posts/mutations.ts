import type { PostLocation } from "../../types/post";
import { logAbuseEvent } from "../abuse/log-event";
import { checkDuplicateContent } from "../abuse/duplicate-check";
import {
  createPostRepository,
  reportPostRepository,
  toggleAgreeRepository,
} from "./repository";
import { validatePostContent } from "./validators";

const DUPLICATE_SEED_CONTENTS: string[] = [];
const MAX_REPORT_REASON_CODE_LENGTH = 64;

type CreatePostInput = {
  anonymousDeviceId?: string;
  content: string;
  location: PostLocation;
  resolvedDongCode: string | null;
  resolvedDongName: string;
};

type CreatePostResult =
  | {
      ok: true;
      post: {
        administrativeDongName: string;
        content: string;
        createdAt: string;
        deleteExpiresAt: string;
        id: string;
      };
    }
  | {
      code: "DUPLICATE_CONTENT" | "VALIDATION_ERROR";
      message: string;
      ok: false;
    };

type ReportPostInput = {
  anonymousDeviceId?: string;
  postId: string;
  reasonCode?: string;
};

type ReportPostResult =
  | {
      ok: true;
      postId: string;
    }
  | {
      code: "INVALID_DEVICE_ID" | "INVALID_REASON_CODE";
      message: string;
      ok: false;
    };

function normalizeReportReasonCode(reasonCode: string | null | undefined) {
  const normalizedReasonCode = reasonCode?.trim() ?? "";

  if (!normalizedReasonCode) {
    return null;
  }

  if (normalizedReasonCode.length > MAX_REPORT_REASON_CODE_LENGTH) {
    return null;
  }

  return normalizedReasonCode;
}

export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const validation = validatePostContent(input.content);

  if (!validation.valid) {
    return {
      code: "VALIDATION_ERROR",
      message: validation.message ?? "내용을 다시 확인해 주세요.",
      ok: false,
    };
  }

  const duplicateBlocked = checkDuplicateContent(
    input.content,
    DUPLICATE_SEED_CONTENTS,
  );

  if (duplicateBlocked) {
    await logAbuseEvent("duplicate_content", {
      content: input.content,
    });

    return {
      code: "DUPLICATE_CONTENT",
      message:
        "같은 내용의 글이 이미 있어요. 내용을 조금 수정해 다시 시도해 주세요.",
      ok: false,
    };
  }

  const repositoryResult = await createPostRepository(input);
  const createdAt = repositoryResult.post?.created_at ?? new Date().toISOString();
  const deleteExpiresAt =
    repositoryResult.post?.delete_expires_at ??
    new Date(Date.now() + 180 * 1000).toISOString();

  return {
    ok: true,
    post: {
      id: repositoryResult.post?.id ?? "post_new",
      content: input.content.trim(),
      administrativeDongName: input.resolvedDongName,
      createdAt,
      deleteExpiresAt,
    },
  };
}

export async function toggleAgreeState(
  postId: string,
  anonymousDeviceId?: string,
) {
  const result = await toggleAgreeRepository(postId, anonymousDeviceId);

  return {
    myAgree: result.agreed,
    agreeCount: result.agreeCount,
  };
}

export async function reportPost(
  input: ReportPostInput,
): Promise<ReportPostResult> {
  const anonymousDeviceId = input.anonymousDeviceId?.trim();

  if (!anonymousDeviceId) {
    return {
      code: "INVALID_DEVICE_ID",
      message: "anonymousDeviceId가 필요합니다.",
      ok: false,
    };
  }

  const reasonCode = normalizeReportReasonCode(input.reasonCode);

  if (!reasonCode) {
    return {
      code: "INVALID_REASON_CODE",
      message: "신고 사유 코드가 필요합니다.",
      ok: false,
    };
  }

  const result = await reportPostRepository(
    input.postId,
    reasonCode,
    anonymousDeviceId,
  );

  return {
    ok: true,
    postId: result.postId,
  };
}

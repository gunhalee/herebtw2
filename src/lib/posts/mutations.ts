import type { PostLocation } from "../../types/post";
import type {
  LocationScope,
  LocationSource,
} from "../geo/location-resolution-token";
import {
  createNotificationVerification,
  sendNotificationVerification,
} from "../email/notification-verification";
import {
  createPostRepository,
  findPostByClientRequestIdRepository,
  reportPostRepository,
  toggleAgreeRepository,
} from "./repository";
import { evaluatePostSubmission } from "./post-abuse-evaluation";

const MAX_REPORT_REASON_CODE_LENGTH = 64;
const REPORT_REASON_CODES = new Set([
  "hate_or_abuse",
  "misinformation",
  "spam_or_ad",
  "other_policy",
]);

type CreatePostInput = {
  authorDeviceId: string;
  applicationOrigin: string;
  clientRequestId: string;
  content: string;
  location: PostLocation;
  locationScope: LocationScope;
  locationSource: LocationSource;
  resolvedDongCode: string | null;
  resolvedDongName: string;
  notificationEmail?: string;
};

type CreatedPost = {
  administrativeDongName: string;
  content: string;
  createdAt: string;
  deleteExpiresAt: string;
  id: string;
  publicUuid: string;
};

type CreatePostResult =
  | {
      ok: true;
      post: CreatedPost;
      publicationStatus: "published";
    }
  | {
      code: "DUPLICATE_CONTENT" | "UNSAFE_CONTENT" | "VALIDATION_ERROR";
      message: string;
      ok: false;
    };

type ReportPostInput = {
  deviceId?: string;
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

  if (
    !normalizedReasonCode ||
    normalizedReasonCode.length > MAX_REPORT_REASON_CODE_LENGTH ||
    !REPORT_REASON_CODES.has(normalizedReasonCode)
  ) {
    return null;
  }

  return normalizedReasonCode;
}

function mapCreatedPost(createdPost: {
  administrative_dong_name: string;
  content: string;
  created_at: string;
  delete_expires_at: string;
  id: string;
  public_uuid?: string;
}): CreatedPost {
  if (!createdPost.public_uuid) {
    throw new Error("Created post is missing public UUID.");
  }

  return {
    id: createdPost.id,
    publicUuid: createdPost.public_uuid,
    content: createdPost.content,
    administrativeDongName: createdPost.administrative_dong_name,
    createdAt: createdPost.created_at,
    deleteExpiresAt: createdPost.delete_expires_at,
  };
}

export async function findIdempotentPost(
  authorDeviceId: string,
  clientRequestId: string,
) {
  const post = await findPostByClientRequestIdRepository(
    authorDeviceId,
    clientRequestId,
  );

  return post ? mapCreatedPost(post) : null;
}

export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const evaluation = await evaluatePostSubmission(input);

  if (!evaluation.ok) {
    return evaluation;
  }

  const { normalizedContent } = evaluation;

  let repositoryResult;
  const notificationVerification = input.notificationEmail
    ? createNotificationVerification()
    : null;

  try {
    repositoryResult = await createPostRepository({
      ...input,
      contentFingerprint: normalizedContent.fingerprint,
      fingerprintVersion: normalizedContent.version,
      normalizedContentLoose: normalizedContent.loose,
      normalizedContentStrict: normalizedContent.strict,
      notificationEmailVerificationExpiresAt:
        notificationVerification?.expiresAt,
      notificationEmailVerificationHash: notificationVerification?.tokenHash,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("uq_posts_device_client_request")
    ) {
      const existingPost = await findIdempotentPost(
        input.authorDeviceId,
        input.clientRequestId,
      );

      if (existingPost) {
        return { ok: true, post: existingPost, publicationStatus: "published" };
      }
    }

    throw error;
  }

  const createdPost = repositoryResult.post;

  if (!createdPost) {
    throw new Error("Failed to create post.");
  }

  if (
    input.notificationEmail &&
    notificationVerification &&
    createdPost.public_uuid
  ) {
    await sendNotificationVerification({
      applicationOrigin: input.applicationOrigin,
      publicUuid: createdPost.public_uuid,
      toEmail: input.notificationEmail,
      token: notificationVerification.token,
    });
  }

  return {
    ok: true,
    post: mapCreatedPost(createdPost),
    publicationStatus: "published",
  };
}

export async function toggleAgreeState(postId: string, deviceId?: string) {
  const result = await toggleAgreeRepository(postId, deviceId);

  return {
    myAgree: result.agreed,
    agreeCount: result.agreeCount,
  };
}

export async function reportPost(
  input: ReportPostInput,
): Promise<ReportPostResult> {
  const deviceId = input.deviceId?.trim();

  if (!deviceId) {
    return {
      code: "INVALID_DEVICE_ID",
      message: "기기 정보를 확인할 수 없습니다.",
      ok: false,
    };
  }

  const reasonCode = normalizeReportReasonCode(input.reasonCode);

  if (!reasonCode) {
    return {
      code: "INVALID_REASON_CODE",
      message: "신고 사유를 다시 선택해 주세요.",
      ok: false,
    };
  }

  const result = await reportPostRepository(input.postId, reasonCode, deviceId);

  return {
    ok: true,
    postId: result.postId,
  };
}

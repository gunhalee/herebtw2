import { randomUUID } from "node:crypto";
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
  createQuarantinedPostRepository,
  findPostByClientRequestIdRepository,
  toggleAgreeRepository,
} from "./repository";
import { evaluatePostSubmission } from "./post-abuse-evaluation";
import { encryptModerationEvidence } from "../moderation/evidence-crypto";
import { quantizeLocationTo100MeterGrid } from "../geo/location-buckets";

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

type PublicationStatus = "published" | "under_review";

type CreatePostResult =
  | {
      ok: true;
      post: CreatedPost;
      publicationStatus: PublicationStatus;
    }
  | {
      code: "DUPLICATE_CONTENT" | "UNSAFE_CONTENT" | "VALIDATION_ERROR";
      message: string;
      ok: false;
    };

function mapCreatedPost(createdPost: {
  administrative_dong_name: string;
  content: string;
  created_at: string;
  delete_expires_at: string | null;
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
    deleteExpiresAt: createdPost.delete_expires_at ?? createdPost.created_at,
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

  return post
    ? {
        post: mapCreatedPost(post),
        publicationStatus:
          post.status === "quarantined" || post.moderation_state === "pending_review"
            ? "under_review" as const
            : "published" as const,
      }
    : null;
}

export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const evaluation = await evaluatePostSubmission(input);

  if (!evaluation.ok) {
    return evaluation;
  }

  const { moderation, normalizedContent } = evaluation;

  let repositoryResult;
  const notificationVerification = input.notificationEmail && moderation.action === "allow"
    ? createNotificationVerification()
    : null;

  try {
    if (moderation.action === "quarantine") {
      const casePublicId = randomUUID();
      const evidence = encryptModerationEvidence({
        casePublicId,
        content: input.content.trim(),
        policyVersion: moderation.policyVersion,
      });
      const quantizedLocation = quantizeLocationTo100MeterGrid(input.location);
      const quarantinedPost = await createQuarantinedPostRepository({
        ...evidence,
        administrativeDongCode: input.resolvedDongCode,
        administrativeDongName: input.resolvedDongName,
        authorDeviceId: input.authorDeviceId,
        casePublicId,
        clientRequestId: input.clientRequestId,
        contentHmac: moderation.contentDecisionKey,
        latitude: quantizedLocation.latitude,
        latitudeBucket100m: quantizedLocation.latitudeBucket100m,
        locationScope: input.locationScope,
        locationSource: input.locationSource,
        longitude: quantizedLocation.longitude,
        longitudeBucket100m: quantizedLocation.longitudeBucket100m,
        normalizationVersion: moderation.normalizationVersion,
        notificationEmail: undefined,
        notificationEmailVerificationExpiresAt: notificationVerification?.expiresAt,
        notificationEmailVerificationHash: notificationVerification?.tokenHash,
        policyVersion: moderation.policyVersion,
        priority: moderation.priority,
        reasonCodes: moderation.reasonCodes,
        riskBand: moderation.riskBand === "low" ? "medium" : moderation.riskBand,
      });
      repositoryResult = {
        post: quarantinedPost
          ? {
              administrative_dong_name: input.resolvedDongName,
              content: "안전 확인 중인 글입니다.",
              created_at: quarantinedPost.post_created_at,
              delete_expires_at: quarantinedPost.post_delete_expires_at,
              id: quarantinedPost.post_id,
              moderation_state: "pending_review" as const,
              public_uuid: quarantinedPost.post_public_uuid,
              status: "quarantined" as const,
            }
          : null,
      };
    } else {
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
    }
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
        return { ok: true, ...existingPost };
      }
    }

    throw error;
  }

  const createdPost = repositoryResult.post;

  if (!createdPost) {
    throw new Error("Failed to create post.");
  }

  if (
    moderation.action === "allow" &&
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
    publicationStatus:
      moderation.action === "quarantine" ? "under_review" : "published",
  };
}

export async function toggleAgreeState(postId: string, deviceId?: string) {
  const result = await toggleAgreeRepository(postId, deviceId);

  return {
    myAgree: result.agreed,
    agreeCount: result.agreeCount,
  };
}

export { reportPost } from "./report-mutation";

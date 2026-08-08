import { fingerprintContent } from "../abuse/content-normalization";
import { evaluateContentSafety } from "../abuse/content-safety";
import { logAbuseEvent } from "../abuse/log-event";
import {
  findPostByFingerprintRepository,
  findSimilarRecentPostsRepository,
} from "./repository";
import { validatePostContent } from "./validators";

export async function evaluatePostSubmission(input: {
  authorDeviceId: string;
  content: string;
}) {
  const validation = validatePostContent(input.content);

  if (!validation.valid) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: validation.message ?? "내용을 다시 확인해 주세요.",
      ok: false as const,
    };
  }

  const safety = evaluateContentSafety(input.content);

  if (!safety.allowed) {
    await logAbuseEvent("unsafe_content_rejected", {}, {
      action: "post.create",
      decision: "block",
      deviceId: input.authorDeviceId,
      reasonCode: safety.ruleCode,
    });

    return {
      code: "UNSAFE_CONTENT" as const,
      message: safety.message,
      ok: false as const,
    };
  }

  const normalizedContent = fingerprintContent(input.content);
  const duplicatePost = await findPostByFingerprintRepository(
    input.authorDeviceId,
    normalizedContent.fingerprint,
  );

  if (duplicatePost) {
    await logAbuseEvent("duplicate_content", {
      fingerprintVersion: normalizedContent.version,
    }, {
      action: "post.create",
      decision: "block",
      deviceId: input.authorDeviceId,
      reasonCode: "exact_same_device",
    });

    return {
      code: "DUPLICATE_CONTENT" as const,
      message: "같은 내용의 글을 이미 남겼어요.",
      ok: false as const,
    };
  }

  if (normalizedContent.loose.length >= 6) {
    const similarPosts = await findSimilarRecentPostsRepository(
      input.authorDeviceId,
      normalizedContent.loose,
    );
    const sameDeviceMatch = similarPosts.find(
      (post) => post.same_device && Number(post.similarity_score) >= 0.88,
    );

    if (sameDeviceMatch) {
      await logAbuseEvent("near_duplicate_content", {
        similarityBand: "high",
      }, {
        action: "post.create",
        decision: "block",
        deviceId: input.authorDeviceId,
        reasonCode: "near_same_device",
      });

      return {
        code: "DUPLICATE_CONTENT" as const,
        message: "비슷한 내용의 글을 최근에 남겼어요. 내용을 바꿔 다시 시도해 주세요.",
        ok: false as const,
      };
    }

    const crossDeviceClusterSize = similarPosts.filter(
      (post) => !post.same_device && Number(post.similarity_score) >= 0.92,
    ).length;

    if (crossDeviceClusterSize >= 3) {
      await logAbuseEvent("cross_device_content_cluster", {
        clusterSizeBand: crossDeviceClusterSize >= 6 ? "large" : "medium",
      }, {
        action: "post.create",
        decision: "shadow",
        deviceId: input.authorDeviceId,
        reasonCode: "cross_device_near_duplicate",
      });
    }
  }

  return { normalizedContent, ok: true as const };
}

import { createElement } from "react";
import { voicePageCandidateHeaderLine } from "../content/voice-page";
import { formatAdministrativeAreaNameForHomeDisplay } from "../geo/format-administrative-area";
import { findPostByUuidRepository } from "../posts/repository";
import { formatReplyContentForCard } from "./card-text";
import { generateCardPng } from "./generate";
import { RepliedVoterCard } from "./templates/replied-voter";

export function buildReplyCandidateTagline(input: {
  name: string;
  district?: string | null;
  localCouncilDistrict?: string | null;
  metroCouncilDistrict?: string | null;
  councilType?: string | null;
}) {
  const name = input.name.trim();
  const districtLabel =
    input.localCouncilDistrict?.trim() ||
    input.metroCouncilDistrict?.trim() ||
    input.district?.trim() ||
    "";
  const councilLabel = input.councilType?.trim()
    ? `${input.councilType.trim()} 후보`
    : "후보";
  const parts: string[] = [];

  if (name) parts.push(name);
  if (districtLabel) parts.push(parts.length > 0 ? `· ${districtLabel}` : districtLabel);
  parts.push(councilLabel);
  return parts.join(" ");
}

export async function generateReplyNotificationCard(publicUuid: string) {
  const post = await findPostByUuidRepository(publicUuid);
  if (
    !post ||
    post.reply_status !== "replied" ||
    !post.reply_candidate_name ||
    !post.reply_content
  ) {
    return null;
  }

  const dongName =
    formatAdministrativeAreaNameForHomeDisplay(post.administrative_dong_name).trim() ||
    post.administrative_dong_name;
  const replyTagline = buildReplyCandidateTagline({
    name: post.reply_candidate_name,
    district: post.reply_candidate_district ?? null,
    localCouncilDistrict: post.reply_candidate_local_council_district ?? null,
    metroCouncilDistrict: post.reply_candidate_metro_council_district ?? null,
    councilType: post.reply_candidate_council_type ?? null,
  });

  return generateCardPng(
    createElement(RepliedVoterCard, {
      headerLine: voicePageCandidateHeaderLine(post.administrative_dong_name),
      content: post.content,
      dongName,
      createdAt: post.created_at,
      agreeCount: post.agree_count,
      replyTagline,
      replyContent: formatReplyContentForCard(post.reply_content),
      replyIsPromise: post.reply_is_promise ?? false,
      replyCreatedAt: post.reply_created_at ?? post.created_at,
    }),
  );
}

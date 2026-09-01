import { NextResponse } from "next/server";
import { createElement } from "react";
import { getNetworkRateLimitResponse } from "../../../../lib/abuse/network-guard";
import { ABUSE_POLICY } from "../../../../lib/abuse/policy";
import { formatReplyContentForCard } from "../../../../lib/card/card-text";
import { generateCardPng } from "../../../../lib/card/generate";
import { buildReplyCandidateTagline } from "../../../../lib/card/reply-card";
import { DeliveredVoterCard } from "../../../../lib/card/templates/delivered-voter";
import { RepliedCandidateCard } from "../../../../lib/card/templates/replied-candidate";
import { RepliedVoterCard } from "../../../../lib/card/templates/replied-voter";
import { voicePageCandidateHeaderLine } from "../../../../lib/content/voice-page";
import { formatAdministrativeAreaNameForHomeDisplay } from "../../../../lib/geo/format-administrative-area";
import { findPostByUuidRepository } from "../../../../lib/posts/repository";

type RouteContext = {
  params: Promise<{ uuid: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { uuid } = await context.params;
  const { searchParams } = new URL(request.url);
  const requestedCardType = searchParams.get("type");
  const cardType = requestedCardType === "candidate" ? "candidate" : "voter";
  const rateLimitResponse = await getNetworkRateLimitResponse({
    action: "card.render",
    budgets: ABUSE_POLICY.cardRender.networkBudgets,
    request,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const post = await findPostByUuidRepository(uuid);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const headerLine = voicePageCandidateHeaderLine(post.administrative_dong_name);
  const dongDisplay =
    formatAdministrativeAreaNameForHomeDisplay(
      post.administrative_dong_name,
    ).trim() || post.administrative_dong_name;

  let element;

  if (
    post.reply_status === "replied" &&
    post.reply_candidate_name &&
    post.reply_content
  ) {
    const replyTagline = buildReplyCandidateTagline({
      name: post.reply_candidate_name,
      district: post.reply_candidate_district ?? null,
      localCouncilDistrict: post.reply_candidate_local_council_district ?? null,
      metroCouncilDistrict: post.reply_candidate_metro_council_district ?? null,
      councilType: post.reply_candidate_council_type ?? null,
    });
    const cardReplyContent = formatReplyContentForCard(post.reply_content);

    if (cardType === "candidate") {
      element = createElement(RepliedCandidateCard, {
        headerLine,
        content: post.content,
        dongName: dongDisplay,
        replyTagline,
        replyContent: cardReplyContent,
        replyIsPromise: post.reply_is_promise ?? false,
        agreeCount: post.agree_count,
      });
    } else {
      element = createElement(RepliedVoterCard, {
        headerLine,
        content: post.content,
        dongName: dongDisplay,
        createdAt: post.created_at,
        agreeCount: post.agree_count,
        replyTagline,
        replyContent: cardReplyContent,
        replyIsPromise: post.reply_is_promise ?? false,
        replyCreatedAt: post.reply_created_at ?? post.created_at,
      });
    }
  } else {
    element = createElement(DeliveredVoterCard, {
      headerLine,
      content: post.content,
      dongName: dongDisplay,
      createdAt: post.created_at,
      agreeCount: post.agree_count,
    });
  }

  try {
    const pngBuffer = await generateCardPng(element);

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("[card] Generation failed:", error);
    return NextResponse.json(
      { error: "Card generation failed" },
      { status: 500 },
    );
  }
}

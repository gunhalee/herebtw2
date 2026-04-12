import { NextResponse } from "next/server";
import { createElement } from "react";
import { generateCardPng } from "../../../../lib/card/generate";
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
  const cardType = searchParams.get("type") ?? "voter";
  const shouldDownload = searchParams.get("download") === "1";

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
    if (cardType === "candidate") {
      element = createElement(RepliedCandidateCard, {
        headerLine,
        content: post.content,
        dongName: dongDisplay,
        replyCandidateName: post.reply_candidate_name,
        replyContent: post.reply_content,
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
        replyCandidateName: post.reply_candidate_name,
        replyContent: post.reply_content,
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
        ...(shouldDownload
          ? {
              "Content-Disposition": `attachment; filename="voice-${uuid}.png"`,
            }
          : {}),
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

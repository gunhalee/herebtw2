import { NextResponse } from "next/server";
import { findPostByUuidRepository } from "../../../../lib/posts/repository";
import { generateCardPng } from "../../../../lib/card/generate";
import { DeliveredVoterCard } from "../../../../lib/card/templates/delivered-voter";
import { RepliedVoterCard } from "../../../../lib/card/templates/replied-voter";
import { RepliedCandidateCard } from "../../../../lib/card/templates/replied-candidate";
import { createElement } from "react";

type RouteContext = {
  params: Promise<{ uuid: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { uuid } = await context.params;
  const { searchParams } = new URL(request.url);
  const cardType = searchParams.get("type") ?? "voter";

  const post = await findPostByUuidRepository(uuid);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let element;

  if (
    post.reply_status === "replied" &&
    post.reply_candidate_name &&
    post.reply_content
  ) {
    if (cardType === "candidate") {
      element = createElement(RepliedCandidateCard, {
        content: post.content,
        dongName: post.administrative_dong_name,
        replyCandidateName: post.reply_candidate_name,
        replyContent: post.reply_content,
        replyIsPromise: post.reply_is_promise ?? false,
        agreeCount: post.agree_count,
      });
    } else {
      element = createElement(RepliedVoterCard, {
        content: post.content,
        dongName: post.administrative_dong_name,
        createdAt: post.created_at,
        agreeCount: post.agree_count,
        replyCandidateName: post.reply_candidate_name,
        replyContent: post.reply_content,
        replyIsPromise: post.reply_is_promise ?? false,
      });
    }
  } else {
    element = createElement(DeliveredVoterCard, {
      content: post.content,
      dongName: post.administrative_dong_name,
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

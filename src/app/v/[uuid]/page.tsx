import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VoiceDetailScreen } from "../../../components/voice/voice-detail-screen";
import { voicePageCandidateHeaderLine } from "../../../lib/content/voice-page";
import { findPostByUuidRepository } from "../../../lib/posts/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uuid: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const post = await findPostByUuidRepository(uuid);

  if (!post) {
    return { title: "글을 찾을 수 없습니다" };
  }

  const title = voicePageCandidateHeaderLine(post.administrative_dong_name);
  const description = post.content.length > 50
    ? post.content.slice(0, 50) + "..."
    : post.content;
  const ogImageUrl = `https://herebtw.vercel.app/api/card/${uuid}?type=voter`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1080,
          height: 1350,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function VoiceDetailPage({ params }: PageProps) {
  const { uuid } = await params;
  const post = await findPostByUuidRepository(uuid);

  if (!post) {
    notFound();
  }

  const reply =
    post.reply_id && post.reply_candidate_name && post.reply_content
      ? {
          candidateName: post.reply_candidate_name,
          content: post.reply_content,
          isPromise: post.reply_is_promise ?? false,
          promiseDeadline: post.reply_promise_deadline ?? null,
          createdAt: post.reply_created_at ?? post.created_at,
        }
      : undefined;

  return (
    <VoiceDetailScreen
      post={{
        id: post.id,
        publicUuid: post.public_uuid,
        content: post.content,
        administrativeDongName: post.administrative_dong_name,
        createdAt: post.created_at,
        replyStatus: post.reply_status as "delivered" | "replied",
        agreeCount: post.agree_count,
        reply,
      }}
    />
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VoiceDetailScreen } from "../../../components/voice/voice-detail-screen";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_PNG_PATH,
  SHARE_IMAGE_SVG_PATH,
  SHARE_IMAGE_WIDTH,
  SHARE_TAGLINE,
  SHARE_TITLE,
} from "../../../lib/content/share-metadata";
import { findPostByUuidRepository } from "../../../lib/posts/repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uuid: string }>;
};

export function generateMetadata(): Metadata {
  return {
    title: SHARE_TITLE,
    description: SHARE_TAGLINE,
    openGraph: {
      title: SHARE_TITLE,
      description: SHARE_TAGLINE,
      type: "website",
      siteName: SHARE_TITLE,
      locale: "ko_KR",
      images: [
        {
          url: SHARE_IMAGE_PNG_PATH,
          width: SHARE_IMAGE_WIDTH,
          height: SHARE_IMAGE_HEIGHT,
          alt: SHARE_TITLE,
          type: "image/png",
        },
        {
          url: SHARE_IMAGE_SVG_PATH,
          width: SHARE_IMAGE_WIDTH,
          height: SHARE_IMAGE_HEIGHT,
          alt: SHARE_TITLE,
          type: "image/svg+xml",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description: SHARE_TAGLINE,
      images: [SHARE_IMAGE_PNG_PATH],
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

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VoiceDetailScreen } from "../../../components/voice/voice-detail-screen";
import { findPostByUuidRepository } from "../../../lib/posts/repository";

export const dynamic = "force-dynamic";

const SHARE_TITLE = "여기 근데";
const SHARE_TAGLINE = "한마디 할게요";
const SHARE_IMAGE_URL = "https://herebtw2.vercel.app/checkmark.svg";

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
      images: [
        {
          url: SHARE_IMAGE_URL,
          width: 500,
          height: 500,
          alt: SHARE_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description: SHARE_TAGLINE,
      images: [SHARE_IMAGE_URL],
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

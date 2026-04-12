import { redirect, notFound } from "next/navigation";
import { getCandidateSession } from "../../../../lib/auth/candidate-session";
import { findPostByUuidRepository } from "../../../../lib/posts/repository";
import { ReplyComposeScreen } from "../../../../components/candidate/reply-compose-screen";
import { supabaseSelect } from "../../../../lib/supabase/rest";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export default async function ReplyPage({ params }: PageProps) {
  const session = await getCandidateSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.hasFirstMessage) {
    redirect("/candidate/onboarding");
  }

  const { postId } = await params;

  // Load post by ID
  const posts = await supabaseSelect<Array<{
    id: string;
    public_uuid: string;
    content: string;
    administrative_dong_name: string;
    created_at: string;
    reply_status: string;
  }>>(
    `posts?select=id,public_uuid,content,administrative_dong_name,created_at,reply_status&id=eq.${postId}&status=eq.active&limit=1`,
  );

  const post = posts?.[0];

  if (!post) {
    notFound();
  }

  if (post.reply_status === "replied") {
    redirect(`/v/${post.public_uuid}`);
  }

  return (
    <ReplyComposeScreen
      postId={post.id}
      postContent={post.content}
      postDongName={post.administrative_dong_name}
      postCreatedAt={post.created_at}
      candidateName={session.name}
    />
  );
}

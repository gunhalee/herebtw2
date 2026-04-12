import { ok } from "../../../../lib/api/response";
import { hasSupabaseServerConfig } from "../../../../lib/supabase/config";
import { supabaseSelect } from "../../../../lib/supabase/rest";

type CandidateMessageRow = {
  id: string;
  name: string;
  district: string;
  first_message_id: string;
  first_message_content: string;
  first_message_public_uuid: string;
};

export const revalidate = 60; // ISR: revalidate every 60s

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return ok({ candidates: [] });
  }

  // Join candidates with their first message post
  const rows = await supabaseSelect<CandidateMessageRow[]>(
    "candidates?select=id,name,district,first_message_id,posts!candidates_first_message_id_fkey(content,public_uuid)&is_active=eq.true&first_message_id=not.is.null",
  );

  const candidates =
    rows
      ?.map((row) => {
        const post = (row as unknown as {
          posts: { content: string; public_uuid: string } | null;
        }).posts;

        if (!post) return null;

        return {
          id: row.id,
          name: row.name,
          district: row.district,
          firstMessageContent: post.content,
          firstMessagePublicUuid: post.public_uuid,
        };
      })
      .filter(Boolean) ?? [];

  return ok({ candidates });
}

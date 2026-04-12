import { ok } from "../../../../lib/api/response";
import { hasSupabaseServerConfig } from "../../../../lib/supabase/config";
import { supabaseSelect } from "../../../../lib/supabase/rest";

type CandidateRow = {
  id: string;
  name: string;
  district: string;
  photo_url: string | null;
  first_message_id: string;
};

type PostRow = {
  id: string;
  content: string;
  public_uuid: string;
};

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return ok({ candidates: [], debug: "no_config" });
  }

  try {
    // Fetch candidates that have a first message (no is_active filter)
    const candidateRows = await supabaseSelect<CandidateRow[]>(
      "candidates?select=id,name,district,photo_url,first_message_id&first_message_id=not.is.null",
    );

    if (!candidateRows || candidateRows.length === 0) {
      return ok({ candidates: [], debug: "no_candidates" });
    }

    // Fetch the corresponding posts in one query
    const postIds = candidateRows.map((c) => c.first_message_id).join(",");
    const postRows = await supabaseSelect<PostRow[]>(
      `posts?select=id,content,public_uuid&id=in.(${postIds})`,
    );

    const postMap = new Map((postRows ?? []).map((p) => [p.id, p]));

    const candidates = candidateRows
      .map((c) => {
        const post = postMap.get(c.first_message_id);
        if (!post) return null;
        return {
          id: c.id,
          name: c.name,
          district: c.district,
          photoUrl: c.photo_url ?? null,
          firstMessageContent: post.content,
          firstMessagePublicUuid: post.public_uuid,
        };
      })
      .filter(Boolean);

    return ok({
      candidates,
      debug: `candidates:${candidateRows.length} posts:${postRows?.length ?? 0} matched:${candidates.length}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/candidates/messages] error:", message);
    return ok({ candidates: [], debug: `error: ${message}` });
  }
}

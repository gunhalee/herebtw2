import { ok } from "../../../../../lib/api/response";
import { loadCandidateRepliesFeedRepository } from "../../../../../lib/posts/repository";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "10");
  const cursor = searchParams.get("cursor") ?? undefined;

  const postListState = await loadCandidateRepliesFeedRepository({
    candidateId: id,
    limit: Number.isFinite(limit) ? limit : 10,
    cursor,
  });

  return ok(
    {
      items: postListState.items,
      nextCursor: postListState.nextCursor,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=50",
      },
    },
  );
}

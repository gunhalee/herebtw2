import { ok } from "../../../../lib/api/response";
import { loadGlobalPostsListRepository } from "../../../../lib/posts/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "10");
  const cursor = searchParams.get("cursor") ?? undefined;
  const postListState = await loadGlobalPostsListRepository({
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

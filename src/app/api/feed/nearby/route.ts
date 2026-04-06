import { fail, ok } from "../../../../lib/api/response";
import { dequantizeLocationFrom100MeterGridBuckets } from "../../../../lib/geo/location-buckets";
import { loadPostsListRepository } from "../../../../lib/posts/repository";

function parseBucket(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitudeBucket100m = parseBucket(searchParams.get("latitudeBucket100m"));
  const longitudeBucket100m = parseBucket(searchParams.get("longitudeBucket100m"));
  const limit = Number(searchParams.get("limit") ?? "10");
  const cursor = searchParams.get("cursor") ?? undefined;
  const anonymousDeviceId = searchParams.get("anonymousDeviceId")?.trim() || undefined;

  if (latitudeBucket100m === null || longitudeBucket100m === null) {
    return fail({
      code: "INVALID_LOCATION_BUCKETS",
      message: "Nearby feed requires valid 100m location buckets.",
    });
  }

  const quantizedLocation = dequantizeLocationFrom100MeterGridBuckets({
    latitudeBucket100m,
    longitudeBucket100m,
  });
  const postListState = await loadPostsListRepository({
    anonymousDeviceId,
    limit: Number.isFinite(limit) ? limit : 10,
    cursor,
    location: quantizedLocation,
  });

  return ok(
    {
      items: postListState.items,
      nextCursor: postListState.nextCursor,
    },
    {
      headers: {
        "Cache-Control": anonymousDeviceId
          ? "private, no-store, max-age=0"
          : "public, s-maxage=10, stale-while-revalidate=50",
      },
    },
  );
}

import { fail, ok } from "../../../../../lib/api/response";
import { syncNearbyFeedRepository } from "../../../../../lib/posts/repository";

type NearbyFeedSyncRequest = {
  anonymousDeviceId?: string;
  loadedPostIds?: string[];
  limit?: number;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function POST(request: Request) {
  const body = (await request.json()) as NearbyFeedSyncRequest;
  const latitude = body.location?.latitude;
  const longitude = body.location?.longitude;

  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    return fail(
      {
        code: "INVALID_LOCATION",
        message: "Nearby sync requires a valid viewer location.",
      },
      400,
    );
  }

  const syncState = await syncNearbyFeedRepository({
    anonymousDeviceId: body.anonymousDeviceId?.trim() || undefined,
    loadedPostIds: Array.isArray(body.loadedPostIds) ? body.loadedPostIds : [],
    limit: isFiniteNumber(body.limit) ? body.limit : undefined,
    location: {
      latitude,
      longitude,
    },
  });

  return ok(
    {
      items: syncState.items.map((item) => ({
        ...item,
        canReport: body.anonymousDeviceId ? item.canReport : true,
      })),
      nextCursor: syncState.nextCursor,
      newItemsCount: syncState.newItemsCount,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}

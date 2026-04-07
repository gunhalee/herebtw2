import { readJsonBody } from "../../../../../lib/api/request";
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
  const bodyResult = await readJsonBody<NearbyFeedSyncRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { anonymousDeviceId, limit, loadedPostIds, location } = bodyResult.body;
  const latitude = location?.latitude;
  const longitude = location?.longitude;

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
    anonymousDeviceId: anonymousDeviceId?.trim() || undefined,
    loadedPostIds: Array.isArray(loadedPostIds) ? loadedPostIds : [],
    limit: isFiniteNumber(limit) ? limit : undefined,
    location: {
      latitude,
      longitude,
    },
  });

  return ok(
    {
      items: syncState.items.map((item) => ({
        ...item,
        canReport: anonymousDeviceId ? item.canReport : true,
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

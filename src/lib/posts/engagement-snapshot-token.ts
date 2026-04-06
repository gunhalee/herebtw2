type PostEngagementSnapshotTokenItem = {
  id: string;
  agreeCount: number;
  myAgree: boolean;
};

const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

function updateFnv1aHash(hash: number, value: string) {
  let nextHash = hash;

  for (let index = 0; index < value.length; index += 1) {
    nextHash ^= value.charCodeAt(index);
    nextHash = Math.imul(nextHash, FNV_PRIME);
  }

  return nextHash >>> 0;
}

export function createPostEngagementSnapshotToken(
  items: ReadonlyArray<PostEngagementSnapshotTokenItem>,
) {
  let hash = FNV_OFFSET_BASIS;

  for (const item of items) {
    hash = updateFnv1aHash(hash, item.id);
    hash = updateFnv1aHash(hash, ":");
    hash = updateFnv1aHash(hash, String(item.agreeCount));
    hash = updateFnv1aHash(hash, ":");
    hash = updateFnv1aHash(hash, item.myAgree ? "1" : "0");
    hash = updateFnv1aHash(hash, "|");
  }

  return `engagement:${items.length}:${hash.toString(36)}`;
}

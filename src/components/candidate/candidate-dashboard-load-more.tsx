"use client";

import { useState } from "react";
import type { CandidateDashboardFilter } from "../../lib/candidate-dashboard/types";
import type { DashboardPost } from "./candidate-dashboard-types";
import { CandidateDashboardPostList } from "./candidate-dashboard-post-list";
import { fetchCandidateDashboardPage } from "./candidate-dashboard-api";

export function CandidateDashboardLoadMore({
  filter,
  initialCursor,
}: {
  filter: CandidateDashboardFilter;
  initialCursor: string | null;
}) {
  const [cursor, setCursor] = useState(initialCursor);
  const [items, setItems] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidateDashboardPage({ cursor, filter });
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...data.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(data.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "글을 더 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.length > 0 ? <CandidateDashboardPostList posts={items} showHeading={false} /> : null}
      {error ? <p role="alert" style={{ color: "#b91c1c", padding: "0 20px" }}>{error}</p> : null}
      {cursor ? (
        <div style={{ padding: "0 20px 32px" }}>
          <button type="button" disabled={loading} onClick={() => void loadMore()} style={{ width: "100%", padding: "12px" }}>
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      ) : null}
    </>
  );
}

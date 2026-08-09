import type {
  DashboardPost,
  DashboardStats,
  FirstMessage,
} from "./candidate-dashboard-types";
import { CandidateDashboardHeader } from "./candidate-dashboard-header";
import { CandidateDashboardPostList } from "./candidate-dashboard-post-list";
import { CandidateDashboardStatsGrid } from "./candidate-dashboard-stats-grid";
import { CandidateFirstMessageSection } from "./candidate-first-message-section";
import { CandidateDashboardFilters } from "./candidate-dashboard-filters";
import { CandidateDashboardLoadMore } from "./candidate-dashboard-load-more";
import type { CandidateDashboardFilter } from "../../lib/candidate-dashboard/types";

type DashboardScreenProps = {
  candidateName: string;
  district: string;
  posts: DashboardPost[];
  stats: DashboardStats;
  firstMessage: FirstMessage | null;
  firstMessagePending?: boolean;
  filter?: CandidateDashboardFilter;
  nextCursor?: string | null;
};

export function DashboardScreen({
  candidateName,
  district,
  posts,
  stats,
  firstMessage,
  firstMessagePending = false,
  filter,
  nextCursor = null,
}: DashboardScreenProps) {
  return (
    <div
      style={{
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "100%",
      }}
    >
      <CandidateDashboardHeader
        candidateName={candidateName}
        district={district}
      />

      {firstMessage ? (
        <CandidateFirstMessageSection initialContent={firstMessage.content} />
      ) : null}

      {firstMessagePending ? (
        <div style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa", color: "#9a3412", fontSize: "13px", lineHeight: 1.5, padding: "14px 20px" }}>
          첫 메시지 내용을 안전하게 확인하고 있어요. 확인이 끝나기 전에는 주민에게 공개되지 않습니다.
        </div>
      ) : null}

      {filter ? <CandidateDashboardFilters filter={filter} /> : null}
      <CandidateDashboardStatsGrid stats={stats} />
      <CandidateDashboardPostList posts={posts} />
      {filter ? (
        <CandidateDashboardLoadMore
          key={filter}
          filter={filter}
          initialCursor={nextCursor}
        />
      ) : null}
    </div>
  );
}

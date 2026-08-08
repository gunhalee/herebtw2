"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/client";
import type {
  DashboardPost,
  DashboardStats,
  FirstMessage,
} from "./candidate-dashboard-types";
import { CandidateDashboardHeader } from "./candidate-dashboard-header";
import { CandidateDashboardPostList } from "./candidate-dashboard-post-list";
import { CandidateDashboardStatsGrid } from "./candidate-dashboard-stats-grid";
import { CandidateFirstMessagePanel } from "./candidate-first-message-panel";
import { useCandidateFirstMessageEditor } from "./use-candidate-first-message-editor";

type DashboardScreenProps = {
  candidateName: string;
  district: string;
  posts: DashboardPost[];
  stats: DashboardStats;
  firstMessage: FirstMessage | null;
  firstMessagePending?: boolean;
};

export function DashboardScreen({
  candidateName,
  district,
  posts,
  stats,
  firstMessage,
  firstMessagePending = false,
}: DashboardScreenProps) {
  const router = useRouter();
  const firstMessageEditor = useCandidateFirstMessageEditor(
    firstMessage?.content ?? "",
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

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
        onLogout={handleLogout}
      />

      {firstMessage ? (
        <CandidateFirstMessagePanel
          content={firstMessageEditor.messageContent}
          editing={firstMessageEditor.editingMessage}
          errorMessage={firstMessageEditor.messageError}
          saving={firstMessageEditor.savingMessage}
          onCancel={firstMessageEditor.handleCancelEdit}
          onChangeContent={firstMessageEditor.handleChangeMessageContent}
          onSave={firstMessageEditor.handleSaveMessage}
          onStartEditing={firstMessageEditor.startEditing}
        />
      ) : null}

      {firstMessagePending ? (
        <div style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa", color: "#9a3412", fontSize: "13px", lineHeight: 1.5, padding: "14px 20px" }}>
          첫 메시지 내용을 안전하게 확인하고 있어요. 확인이 끝나기 전에는 주민에게 공개되지 않습니다.
        </div>
      ) : null}

      <CandidateDashboardStatsGrid stats={stats} />
      <CandidateDashboardPostList posts={posts} />
    </div>
  );
}

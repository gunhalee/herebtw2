import { LoadingState } from "../../../components/common/loading-state";
import { uiColors, uiSpacing } from "../../../lib/ui/tokens";

export default function CandidateDashboardLoading() {
  return (
    <main
      style={{
        background: "#f9fafb",
        minHeight: "100dvh",
        padding: uiSpacing.pageX,
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: "640px" }}>
        <h1 style={{ color: uiColors.textStrong, fontSize: "20px" }}>
          후보자 대시보드
        </h1>
        <LoadingState label="지역의 답변 대기 글을 불러오고 있습니다." />
      </div>
    </main>
  );
}

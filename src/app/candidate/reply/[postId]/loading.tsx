import { LoadingState } from "../../../../components/common/loading-state";
import { uiSpacing } from "../../../../lib/ui/tokens";

export default function CandidateReplyLoading() {
  return (
    <main style={{ minHeight: "100dvh", padding: uiSpacing.pageX }}>
      <div style={{ margin: "0 auto", maxWidth: "640px" }}>
        <LoadingState label="답변할 글을 확인하고 있습니다." />
      </div>
    </main>
  );
}

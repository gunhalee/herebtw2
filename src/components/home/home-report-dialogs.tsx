import { ErrorState } from "../common/error-state";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

type HomeReportDialogsProps = {
  reportDialogOpen?: boolean;
  reportErrorMessage?: string | null;
  reportSubmitting?: boolean;
  reportSuccessMessage?: string | null;
  onCloseReportDialog?: () => void;
  onCloseReportSuccessDialog?: () => void;
  onConfirmReport?: () => void;
};

export function HomeReportDialogs({
  reportDialogOpen = false,
  reportErrorMessage = null,
  reportSubmitting = false,
  reportSuccessMessage = null,
  onCloseReportDialog,
  onCloseReportSuccessDialog,
  onConfirmReport,
}: HomeReportDialogsProps) {
  return (
    <>
      {reportSuccessMessage ? (
        <div
          aria-live="polite"
          onClick={onCloseReportSuccessDialog}
          style={{
            alignItems: "center",
            background: "rgba(17, 24, 39, 0.28)",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            padding: uiSpacing.pageX,
            position: "absolute",
            zIndex: 31,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: uiColors.surface,
              border: `1px solid ${uiColors.border}`,
              borderRadius: "22px",
              boxShadow: "0 12px 28px rgba(17, 24, 39, 0.14)",
              color: uiColors.textStrong,
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.lg,
              maxWidth: "320px",
              padding: `${uiSpacing.xl} ${uiSpacing.xl}`,
              textAlign: "center",
              width: "100%",
            }}
          >
            <h2
              style={{
                color: uiColors.textStrong,
                fontSize: "15px",
                fontWeight: 700,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {reportSuccessMessage}
            </h2>
            <p
              style={{
                color: uiColors.textMuted,
                fontSize: "13px",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              운영자가 확인할 예정입니다.
            </p>
            <button
              onClick={onCloseReportSuccessDialog}
              style={{
                appearance: "none",
                background: "#f3f5f7",
                border: "1px solid rgba(17, 24, 39, 0.08)",
                borderRadius: uiRadius.pill,
                color: uiColors.textStrong,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                padding: `${uiSpacing.md} ${uiSpacing.lg}`,
              }}
              type="button"
            >
              확인
            </button>
          </div>
        </div>
      ) : null}

      {reportDialogOpen ? (
        <div
          onClick={reportSubmitting ? undefined : onCloseReportDialog}
          style={{
            alignItems: "center",
            background: "rgba(17, 24, 39, 0.28)",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            padding: uiSpacing.pageX,
            position: "absolute",
            zIndex: 30,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: uiColors.surface,
              border: `1px solid ${uiColors.border}`,
              borderRadius: "22px",
              boxShadow: "0 12px 28px rgba(17, 24, 39, 0.14)",
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xl,
              maxWidth: "320px",
              padding: `${uiSpacing.xl} ${uiSpacing.xl}`,
              width: "100%",
            }}
          >
            <h2
              style={{
                color: uiColors.textStrong,
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
                textAlign: "center",
              }}
            >
              이 글을 신고할까요?
            </h2>

            {reportErrorMessage ? <ErrorState message={reportErrorMessage} /> : null}

            <div
              style={{
                display: "flex",
                gap: uiSpacing.sm,
              }}
            >
              <button
                disabled={reportSubmitting}
                onClick={onCloseReportDialog}
                style={{
                  appearance: "none",
                  background: "#f3f5f7",
                  border: "1px solid rgba(17, 24, 39, 0.08)",
                  borderRadius: uiRadius.pill,
                  color: uiColors.textStrong,
                  cursor: reportSubmitting ? "default" : "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                }}
                type="button"
              >
                닫기
              </button>
              <button
                disabled={reportSubmitting}
                onClick={onConfirmReport}
                style={{
                  appearance: "none",
                  background: "#f3f5f7",
                  border: "1px solid rgba(17, 24, 39, 0.08)",
                  borderRadius: uiRadius.pill,
                  color: uiColors.textStrong,
                  cursor: reportSubmitting ? "default" : "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                }}
                type="button"
              >
                {reportSubmitting ? "처리 중.." : "예"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

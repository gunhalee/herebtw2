"use client";

import { AlertTriangle } from "lucide-react";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

type CandidateReplyConfirmDialogProps = {
  isPromise: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function CandidateReplyConfirmDialog({
  isPromise,
  submitting,
  onCancel,
  onConfirm,
}: CandidateReplyConfirmDialogProps) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(17, 24, 39, 0.4)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: uiSpacing.pageX,
        position: "fixed",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: uiRadius.lg,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xl,
          maxWidth: 360,
          padding: uiSpacing.xxl,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.sm,
            textAlign: "center",
          }}
        >
          <AlertTriangle size={32} color="#f59e0b" />
          <h3
            style={{
              color: uiColors.textStrong,
              fontSize: "16px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            답변을 등록하시겠습니까?
          </h3>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            답변은 등록 후 수정할 수 없습니다.
            {isPromise ? " 이 답변은 '약속' 으로 기록됩니다." : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: uiSpacing.sm }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            type="button"
            style={{
              appearance: "none",
              background: uiColors.surfaceMuted,
              border: `1px solid ${uiColors.border}`,
              borderRadius: uiRadius.md,
              color: uiColors.textBody,
              cursor: "pointer",
              flex: 1,
              fontSize: "14px",
              fontWeight: 600,
              padding: "12px",
            }}
          >
            취소
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={submitting}
            type="button"
            style={{
              appearance: "none",
              background: uiColors.buttonPrimary,
              border: "none",
              borderRadius: uiRadius.md,
              color: "#ffffff",
              cursor: submitting ? "default" : "pointer",
              flex: 1,
              fontSize: "14px",
              fontWeight: 700,
              opacity: submitting ? 0.7 : 1,
              padding: "12px",
            }}
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Check, Pencil, X } from "lucide-react";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

type CandidateFirstMessagePanelProps = {
  content: string;
  editing: boolean;
  errorMessage: string | null;
  saving: boolean;
  onCancel: () => void;
  onChangeContent: (value: string) => void;
  onSave: () => void | Promise<void>;
  onStartEditing: () => void;
};

export function CandidateFirstMessagePanel({
  content,
  editing,
  errorMessage,
  saving,
  onCancel,
  onChangeContent,
  onSave,
  onStartEditing,
}: CandidateFirstMessagePanelProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderBottom: `1px solid ${uiColors.border}`,
        padding: `${uiSpacing.md} ${uiSpacing.pageX}`,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: uiSpacing.xs,
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: uiColors.textMuted,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          후보자 한마디
        </span>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <textarea
            value={content}
            onChange={(event) => onChangeContent(event.target.value)}
            maxLength={100}
            rows={2}
            style={{
              border: `1px solid ${uiColors.border}`,
              borderRadius: uiRadius.md,
              boxSizing: "border-box",
              color: uiColors.textStrong,
              fontSize: "14px",
              lineHeight: 1.5,
              outline: "none",
              padding: "8px 10px",
              resize: "none",
              width: "100%",
            }}
          />
          <div style={{ alignItems: "center", display: "flex", gap: "6px" }}>
            <span style={{ color: uiColors.textMuted, fontSize: "11px", marginRight: "auto" }}>
              {content.trim().length}/100
            </span>
            {errorMessage ? (
              <span style={{ color: "#ef4444", fontSize: "11px" }}>{errorMessage}</span>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              style={{
                alignItems: "center",
                appearance: "none",
                background: "transparent",
                border: `1px solid ${uiColors.border}`,
                borderRadius: uiRadius.md,
                color: uiColors.textMuted,
                cursor: "pointer",
                display: "flex",
                fontSize: "12px",
                gap: "3px",
                padding: "4px 10px",
              }}
            >
              <X size={12} />
              취소
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
              style={{
                alignItems: "center",
                appearance: "none",
                background: uiColors.buttonPrimary,
                border: "none",
                borderRadius: uiRadius.md,
                color: "#ffffff",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                fontSize: "12px",
                fontWeight: 600,
                gap: "3px",
                opacity: saving ? 0.6 : 1,
                padding: "4px 10px",
              }}
            >
              <Check size={12} />
              저장
            </button>
          </div>
        </div>
      ) : (
        <div style={{ alignItems: "flex-start", display: "flex", gap: "8px" }}>
          <p
            style={{
              color: uiColors.textStrong,
              flex: 1,
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {content}
          </p>
          <button
            type="button"
            onClick={onStartEditing}
            style={{
              alignItems: "center",
              appearance: "none",
              background: "transparent",
              border: `1px solid ${uiColors.border}`,
              borderRadius: uiRadius.md,
              color: uiColors.textMuted,
              cursor: "pointer",
              display: "flex",
              flexShrink: 0,
              fontSize: "12px",
              gap: "3px",
              padding: "3px 8px",
            }}
          >
            <Pencil size={11} />
            수정
          </button>
        </div>
      )}
    </div>
  );
}

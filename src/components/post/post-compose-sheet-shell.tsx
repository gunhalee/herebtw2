"use client";

import type { ReactNode } from "react";
import { uiShadow, uiSpacing } from "../../lib/ui/tokens";

type PostComposeSheetShellProps = {
  children: ReactNode;
  keyboardInset: number;
  maxHeight: number;
  sheetHeight: number;
  onDismiss?: () => void;
};

export function PostComposeSheetShell({
  children,
  keyboardInset,
  maxHeight,
  sheetHeight,
  onDismiss,
}: PostComposeSheetShellProps) {
  return (
    <div
      aria-modal="true"
      className="compose-sheet-overlay"
      role="dialog"
    >
      <button
        aria-label="글쓰기 닫기"
        className="compose-sheet-overlay__backdrop"
        onClick={onDismiss}
        type="button"
      />
      <section
        className="compose-sheet-panel"
        style={{
          background: "#ffffff",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          boxShadow: uiShadow.sheet,
          display: "flex",
          flexDirection: "column",
          height: `${sheetHeight}px`,
          marginBottom: `${keyboardInset}px`,
          maxHeight: `${maxHeight}px`,
          overflow: "hidden",
          padding: `${uiSpacing.md} ${uiSpacing.pageX} calc(${uiSpacing.lg} + env(safe-area-inset-bottom, 0px))`,
          position: "relative",
          width: "100%",
        }}
      >
        {children}
      </section>
    </div>
  );
}

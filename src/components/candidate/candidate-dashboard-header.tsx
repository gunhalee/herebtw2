"use client";

import { LogOut } from "lucide-react";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";

type CandidateDashboardHeaderProps = {
  candidateName: string;
  district: string;
  onLogout: () => void | Promise<void>;
};

export function CandidateDashboardHeader({
  candidateName,
  district,
  onLogout,
}: CandidateDashboardHeaderProps) {
  return (
    <header
      style={{
        alignItems: "center",
        background: "#ffffff",
        borderBottom: `1px solid ${uiColors.border}`,
        display: "flex",
        justifyContent: "space-between",
        padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
        paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
      }}
    >
      <div>
        <h1
          style={{
            color: uiColors.textStrong,
            fontSize: "16px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {candidateName} 후보
        </h1>
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: "12px",
            margin: 0,
          }}
        >
          {district}
        </p>
      </div>
      <button
        onClick={() => void onLogout()}
        type="button"
        style={{
          alignItems: "center",
          appearance: "none",
          background: "transparent",
          border: "none",
          color: uiColors.textMuted,
          cursor: "pointer",
          display: "flex",
          gap: "4px",
          fontSize: "12px",
          padding: uiSpacing.xs,
        }}
      >
        <LogOut size={14} />
        로그아웃
      </button>
    </header>
  );
}

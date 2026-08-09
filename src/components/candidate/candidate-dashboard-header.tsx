import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import { CandidateLogoutButton } from "./candidate-logout-button";

type CandidateDashboardHeaderProps = {
  candidateName: string;
  district: string;
};

export function CandidateDashboardHeader({
  candidateName,
  district,
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
      <CandidateLogoutButton />
    </header>
  );
}

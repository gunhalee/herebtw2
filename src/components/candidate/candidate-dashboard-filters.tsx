import Link from "next/link";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import type { CandidateDashboardFilter } from "../../lib/candidate-dashboard/types";

export function CandidateDashboardFilters({
  filter,
}: {
  filter: CandidateDashboardFilter;
}) {
  return (
    <nav aria-label="후보자 글 목록" style={{ display: "flex", gap: uiSpacing.xs, padding: `${uiSpacing.md} ${uiSpacing.pageX} 0` }}>
      {([
        ["open", "답변 대기"],
        ["mine", "내가 답변한 글"],
      ] as const).map(([value, label]) => (
        <Link
          key={value}
          href={value === "open" ? "/candidate/dashboard" : `/candidate/dashboard?filter=${value}`}
          prefetch={false}
          aria-current={filter === value ? "page" : undefined}
          style={{
            background: filter === value ? uiColors.buttonPrimary : "#ffffff",
            border: `1px solid ${filter === value ? uiColors.buttonPrimary : uiColors.border}`,
            borderRadius: uiRadius.md,
            color: filter === value ? "#ffffff" : uiColors.textBody,
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 12px",
            textDecoration: "none",
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

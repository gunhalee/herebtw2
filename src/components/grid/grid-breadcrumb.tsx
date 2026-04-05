import {
  uiColors,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type GridBreadcrumbItem = {
  label: string;
  current?: boolean;
};

export type GridBreadcrumbProps = {
  items: GridBreadcrumbItem[];
};

export function GridBreadcrumb({ items }: GridBreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="지역 경로">
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: uiSpacing.xs,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            style={{
              alignItems: "center",
              display: "flex",
              gap: uiSpacing.xs,
            }}
          >
            <span
              style={{
                color: item.current ? uiColors.textStrong : uiColors.textMuted,
                fontSize: uiTypography.breadcrumb.fontSize,
                fontWeight: item.current ? 700 : 500,
              }}
            >
              {item.label}
            </span>
            {index < items.length - 1 ? (
              <span aria-hidden="true" style={{ color: uiColors.divider }}>
                /
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

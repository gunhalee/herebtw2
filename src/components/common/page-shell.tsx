import type { ReactNode } from "react";
import { uiSpacing } from "../../lib/ui/tokens";

export type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.xxl,
        minHeight: "100dvh",
        padding: `${uiSpacing.pageY} ${uiSpacing.pageX}`,
        width: "100%",
      }}
    >
      {children}
    </main>
  );
}

"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/client";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";

export function CandidateLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <button
      onClick={() => void handleLogout()}
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
  );
}

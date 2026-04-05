"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "../common/page-shell";
import { ensureRegisteredBrowserDevice } from "../../lib/device/browser-device";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import type { ApiResponse } from "../../types/api";
import type { PostComposeState } from "../../types/post";
import { PostComposeForm } from "./post-compose-form";

const DEFAULT_LOCATION = {
  latitude: 37.4979,
  longitude: 127.0276,
};

const DEFAULT_REGION = {
  administrativeDongName: "역삼1동",
  administrativeDongCode: "11680640",
  gridCellPath: "nation.seoul.gangnam.yeoksam1",
};

function createInitialComposeState(): PostComposeState {
  return {
    content: "",
    charCount: 0,
    submitting: false,
    locationResolved: true,
    resolvedDongName: DEFAULT_REGION.administrativeDongName,
    resolvedDongCode: DEFAULT_REGION.administrativeDongCode,
    resolvedGridCellPath: DEFAULT_REGION.gridCellPath,
    cooldownRemainingSeconds: 0,
    duplicateBlocked: false,
    errorMessage: null,
  };
}

type WriteScreenProps = {
  dataSourceMode: "supabase" | "mock";
};

export function WriteScreen({ dataSourceMode }: WriteScreenProps) {
  const router = useRouter();
  const [composeState, setComposeState] = useState(createInitialComposeState);

  function handleChangeContent(value: string) {
    setComposeState((current) => ({
      ...current,
      content: value,
      charCount: value.trim().length,
      duplicateBlocked: false,
      errorMessage: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dataSourceMode !== "supabase") {
      setComposeState((current) => ({
        ...current,
        errorMessage:
          "Supabase 환경변수를 먼저 설정해야 실제로 글을 저장할 수 있어요.",
      }));
      return;
    }

    setComposeState((current) => ({
      ...current,
      submitting: true,
      errorMessage: null,
    }));

    try {
      const anonymousDeviceId = await ensureRegisteredBrowserDevice();
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonymousDeviceId,
          content: composeState.content,
          location: DEFAULT_LOCATION,
          clientResolved: {
            administrativeDongName:
              composeState.resolvedDongName ??
              DEFAULT_REGION.administrativeDongName,
            administrativeDongCode:
              composeState.resolvedDongCode ??
              DEFAULT_REGION.administrativeDongCode,
            gridCellPath:
              composeState.resolvedGridCellPath ?? DEFAULT_REGION.gridCellPath,
          },
        }),
      });
      const json = (await response.json()) as ApiResponse<{
        post: {
          id: string;
        };
      }>;

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? "글을 등록하지 못했습니다.");
      }

      router.replace("/");
    } catch (error) {
      setComposeState((current) => ({
        ...current,
        submitting: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "글을 등록하지 못했습니다.",
      }));
    }
  }

  return (
    <PageShell>
      <header
        style={{
          background: uiColors.surfaceMuted,
          border: `1px solid ${uiColors.border}`,
          borderRadius: uiRadius.lg,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          padding: uiSpacing.xl,
        }}
      >
        <h1
          style={{
            color: uiColors.textStrong,
            fontSize: "22px",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          여기 근데 남기기
        </h1>

        <p
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.body.fontSize,
            margin: 0,
          }}
        >
          지금 있는 위치에서 느낀 문제나 좋은 점을 100자 안으로 적어 주세요.
        </p>

        <div
          style={{
            background:
              dataSourceMode === "supabase" ? "#eff6ff" : "#fff7ed",
            border: `1px solid ${
              dataSourceMode === "supabase" ? "#93c5fd" : "#fdba74"
            }`,
            borderRadius: uiRadius.md,
            color: dataSourceMode === "supabase" ? "#1d4ed8" : "#9a3412",
            fontSize: "12px",
            lineHeight: 1.5,
            marginTop: uiSpacing.sm,
            padding: `${uiSpacing.sm} ${uiSpacing.md}`,
          }}
        >
          {dataSourceMode === "supabase"
            ? "Supabase 저장 모드입니다. 등록 후 홈 피드에서 바로 확인할 수 있어요."
            : "샘플 모드입니다. Supabase 환경변수를 넣기 전에는 글이 실제로 저장되지 않아요."}
        </div>
      </header>

      <PostComposeForm
        {...composeState}
        onChangeContent={handleChangeContent}
        onSubmit={handleSubmit}
        submitDisabled={dataSourceMode !== "supabase"}
      />

      <section
        style={{
          background: uiColors.surface,
          border: `1px solid ${uiColors.border}`,
          borderRadius: uiRadius.lg,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.sm,
          padding: uiSpacing.xl,
        }}
      >
        <p
          style={{
            color: uiColors.textStrong,
            fontSize: uiTypography.body.fontSize,
            margin: 0,
          }}
        >
          현재 MVP에서는 위치 해석을 기본 동네 값으로 연결해 두었습니다.
        </p>
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.meta.fontSize,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          실제 역지오코딩과 지도 연동은 다음 단계에서 붙이면 되고, 지금은
          Supabase 저장과 홈 피드 반영 흐름을 먼저 검증할 수 있어요.
        </p>
      </section>
    </PageShell>
  );
}

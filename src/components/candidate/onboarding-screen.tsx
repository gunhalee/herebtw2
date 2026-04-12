"use client";

import { MessageSquare } from "lucide-react";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import { CandidateOnboardingForm } from "./candidate-onboarding-form";
import { useCandidateOnboarding } from "./use-candidate-onboarding";

type OnboardingScreenProps = {
  candidateName: string;
  district: string;
};

export function OnboardingScreen({
  candidateName,
  district,
}: OnboardingScreenProps) {
  const onboarding = useCandidateOnboarding();

  return (
    <div
      style={{
        alignItems: "center",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xxl,
          maxWidth: 480,
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              alignItems: "center",
              background: "#eff6ff",
              borderRadius: "50%",
              display: "inline-flex",
              height: 56,
              justifyContent: "center",
              marginBottom: uiSpacing.md,
              width: 56,
            }}
          >
            <MessageSquare size={28} color="#2563eb" />
          </div>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            {candidateName} 후보님, 환영합니다.
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {district} 주민분들께 첫 인사를 남겨 주세요.
            <br />
            첫 메시지는 글 목록 상단에 고정됩니다.
          </p>
        </div>

        <CandidateOnboardingForm
          candidateName={candidateName}
          district={district}
          content={onboarding.content}
          charCount={onboarding.charCount}
          error={onboarding.error}
          submitting={onboarding.submitting}
          submitDisabled={onboarding.submitDisabled}
          onChangeContent={onboarding.handleChangeContent}
          onSubmit={onboarding.handleSubmit}
        />
      </div>
    </div>
  );
}

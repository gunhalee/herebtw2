"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/client";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function CandidateMfaPanel() {
  const started = useRef(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function prepare() {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.replace("/auth/login");
        return;
      }

      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel === "aal2") {
        window.location.replace("/candidate/dashboard");
        return;
      }

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError || !factors) {
        setError("추가 인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.");
        setLoading(false);
        return;
      }

      const verifiedTotp = factors.totp[0];
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setLoading(false);
        return;
      }

      for (const factor of factors.all) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data: enrolled, error: enrollError } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "여기 근데 후보자 대시보드",
        });
      if (enrollError || !enrolled) {
        setError("인증 앱 등록을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
        return;
      }

      setFactorId(enrolled.id);
      setEnrollment({
        factorId: enrolled.id,
        qrCode: enrolled.totp.qr_code,
        secret: enrolled.totp.secret,
      });
      setLoading(false);
    }

    void prepare();
  }, []);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("인증 앱에 표시된 6자리 코드를 입력해 주세요.");
      return;
    }

    setVerifying(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } =
      await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setError("인증 코드가 올바르지 않거나 만료되었습니다. 새 코드를 입력해 주세요.");
      setCode("");
      setVerifying(false);
      return;
    }
    window.location.replace("/candidate/dashboard");
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.replace("/auth/login");
  }

  return (
    <main style={{ alignItems: "center", background: "#fff", display: "flex", justifyContent: "center", minHeight: "100dvh", padding: `${uiSpacing.xxl} ${uiSpacing.pageX}` }}>
      <section style={{ display: "flex", flexDirection: "column", gap: uiSpacing.lg, maxWidth: 400, width: "100%" }}>
        <div>
          <h1 style={{ color: uiColors.textStrong, fontSize: "24px", margin: "0 0 8px" }}>후보자 추가 인증</h1>
          <p style={{ color: uiColors.textMuted, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
            후보자 계정과 답변을 보호하기 위해 인증 앱의 일회용 코드를 확인합니다.
          </p>
        </div>

        {loading ? <p aria-live="polite">인증 정보를 확인하고 있습니다...</p> : null}

        {!loading && enrollment ? (
          <div style={{ background: uiColors.surfaceMuted, borderRadius: uiRadius.md, padding: uiSpacing.lg }}>
            <p style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>처음 한 번만 등록해 주세요</p>
            <ol style={{ color: uiColors.textBody, fontSize: "13px", lineHeight: 1.7, margin: 0, paddingLeft: "20px" }}>
              <li>Google Authenticator 등 인증 앱을 여세요.</li>
              <li>아래 QR 코드를 스캔하세요.</li>
              <li>앱에 표시된 6자리 코드를 입력하세요.</li>
            </ol>
            <img src={enrollment.qrCode} alt="인증 앱 등록 QR 코드" width={220} height={220} style={{ display: "block", margin: "16px auto", maxWidth: "100%" }} />
            <details>
              <summary style={{ color: uiColors.textMuted, cursor: "pointer", fontSize: "12px" }}>QR 코드를 스캔할 수 없나요?</summary>
              <code style={{ display: "block", fontSize: "12px", overflowWrap: "anywhere", paddingTop: "8px" }}>{enrollment.secret}</code>
            </details>
          </div>
        ) : null}

        {!loading && factorId ? (
          <form onSubmit={verify} style={{ display: "flex", flexDirection: "column", gap: uiSpacing.md }}>
            <label htmlFor="mfa-code" style={{ color: uiColors.textBody, fontSize: "13px", fontWeight: 600 }}>6자리 인증 코드</label>
            <input
              id="mfa-code"
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ background: uiColors.surfaceMuted, border: `1px solid ${uiColors.border}`, borderRadius: uiRadius.md, fontSize: "22px", letterSpacing: "0.25em", padding: "14px", textAlign: "center" }}
            />
            {error ? <p role="alert" style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>{error}</p> : null}
            <button type="submit" disabled={verifying || code.length !== 6} style={{ background: uiColors.buttonPrimary, border: 0, borderRadius: uiRadius.md, color: "#fff", fontSize: "15px", fontWeight: 700, padding: "14px" }}>
              {verifying ? "확인 중..." : "인증하고 계속"}
            </button>
          </form>
        ) : null}

        {!loading && !factorId && error ? <p role="alert" style={{ color: uiColors.danger, fontSize: "13px" }}>{error}</p> : null}
        <button type="button" onClick={() => void signOut()} style={{ background: "transparent", border: 0, color: uiColors.textMuted, cursor: "pointer", fontSize: "13px", padding: "8px" }}>다른 계정으로 로그인</button>
      </section>
    </main>
  );
}

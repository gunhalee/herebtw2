import { useState, useRef, useCallback } from "react";

const SAMPLE_DATA = {
  voiceOnly: {
    location: "광주시 능평동",
    message: "우리 동네 놀이터가 너무 낡았어요. 아이들이 다칠까 걱정됩니다.",
    date: "2026.04.12",
  },
  withReply: {
    location: "광주시 능평동",
    message: "우리 동네 놀이터가 너무 낡았어요. 아이들이 다칠까 걱정됩니다.",
    date: "2026.04.12",
    reply: {
      name: "김민수 후보",
      text: "말씀 감사합니다. 능평동 놀이터 현황을 직접 확인하고 개선 방안을 공약에 반영하겠습니다.",
      date: "2026.04.12",
    },
  },
};

function PhotoCard({ data, cardRef }) {
  const hasReply = !!data.reply;

  return (
    <div
      ref={cardRef}
      style={{
        width: 440,
        minHeight: 520,
        background: "#FFFEF5",
        borderRadius: 24,
        padding: "40px 36px 32px",
        fontFamily: "'Noto Sans KR', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* subtle pattern */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      {/* top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 6,
          background: "linear-gradient(90deg, #FFE033, #FFD000)",
        }}
      />

      {/* location badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#FFF8D6",
          border: "1px solid #FFE566",
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 13,
          color: "#8A7A00",
          fontWeight: 500,
          alignSelf: "flex-start",
          marginBottom: 20,
          position: "relative",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8A300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        {data.location}
      </div>

      {/* voice bubble */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "24px 24px",
          marginBottom: hasReply ? 16 : 0,
          position: "relative",
          border: "1px solid #F0EDD8",
          flex: hasReply ? "none" : 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#B0A870",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          주민의 목소리
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: "#2A2A2A",
            fontWeight: 400,
            wordBreak: "keep-all",
          }}
        >
          "{data.message}"
        </div>
        <div style={{ fontSize: 12, color: "#C0B870", marginTop: 12 }}>
          {data.date}
        </div>
      </div>

      {/* reply bubble */}
      {hasReply && (
        <div
          style={{
            background: "linear-gradient(135deg, #FFF9D0, #FFFAE0)",
            borderRadius: 16,
            padding: "20px 24px",
            position: "relative",
            border: "1.5px solid #FFE566",
          }}
        >
          {/* connector */}
          <div style={{
            position: "absolute", top: -10, left: 32,
            width: 2, height: 10, background: "#FFE566",
          }} />

          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD000, #FFBE00)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700,
            }}>
              {data.reply.name[0]}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#5A5000" }}>
              {data.reply.name}
            </div>
            <div style={{
              fontSize: 10, background: "#FFE566", color: "#7A6C00",
              padding: "2px 8px", borderRadius: 10, fontWeight: 600,
            }}>
              인증 후보
            </div>
          </div>
          <div style={{
            fontSize: 15, lineHeight: 1.6, color: "#3A3500",
            wordBreak: "keep-all",
          }}>
            {data.reply.text}
          </div>
          <div style={{ fontSize: 12, color: "#B8A800", marginTop: 10 }}>
            {data.reply.date}
          </div>
        </div>
      )}

      {/* footer branding */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#CCBE40",
          letterSpacing: "-0.02em",
        }}>
          여기 근데 한마디 할게요
        </div>
        <div style={{
          fontSize: 11, color: "#C8BA50",
        }}>
          herebtw.vercel.app
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("withReply");
  const [customVoice, setCustomVoice] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customReply, setCustomReply] = useState("");
  const [customCandidate, setCustomCandidate] = useState("");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const data = (() => {
    const base = SAMPLE_DATA[mode];
    return {
      ...base,
      message: customVoice || base.message,
      location: customLocation || base.location,
      reply: mode === "withReply" ? {
        ...base.reply,
        text: customReply || base.reply.text,
        name: customCandidate || base.reply.name,
      } : undefined,
    };
  })();

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: h2c } = await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js");
      const canvas = await h2c(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "내목소리_포토카드.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      // fallback: try without esm
      try {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(script);
        await new Promise((r) => { script.onload = r; });
        const canvas = await window.html2canvas(cardRef.current, {
          scale: 2, backgroundColor: null, useCORS: true,
        });
        const link = document.createElement("a");
        link.download = "내목소리_포토카드.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (e2) {
        alert("다운로드에 실패했습니다. 스크린샷을 이용해주세요.");
      }
    }
    setDownloading(false);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "transparent",
      fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <h2 style={{
        fontSize: 20, fontWeight: 700, marginBottom: 4,
        color: "var(--text-color, #222)",
      }}>
        포토카드 미리보기
      </h2>
      <p style={{
        fontSize: 13, color: "var(--text-secondary, #888)", marginBottom: 24,
      }}>
        내 목소리를 카드로 만들어 SNS에 공유하세요
      </p>

      {/* mode toggle */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 24,
        background: "var(--bg-secondary, #f4f4f0)", borderRadius: 12, padding: 4,
      }}>
        {[
          { key: "voiceOnly", label: "내 목소리만" },
          { key: "withReply", label: "후보 답변 포함" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              padding: "8px 20px", borderRadius: 10, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
              background: mode === m.key ? "#FFD000" : "transparent",
              color: mode === m.key ? "#3A3000" : "var(--text-secondary, #999)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* card */}
      <div style={{
        borderRadius: 28, padding: 4,
        background: "linear-gradient(135deg, #FFE566 0%, #FFF5AA 50%, #FFE566 100%)",
        marginBottom: 24,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <PhotoCard data={data} cardRef={cardRef} />
      </div>

      {/* download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding: "14px 40px", borderRadius: 14, border: "none",
          background: downloading
            ? "var(--bg-secondary, #e0e0d8)"
            : "linear-gradient(135deg, #FFD000, #FFBE00)",
          color: downloading ? "var(--text-secondary, #aaa)" : "#3A3000",
          fontSize: 15, fontWeight: 700, cursor: downloading ? "wait" : "pointer",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: downloading ? "none" : "0 4px 16px rgba(255,208,0,0.4)",
          transition: "all 0.2s",
          marginBottom: 32,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {downloading ? "생성 중..." : "포토카드 다운로드"}
      </button>

      {/* edit fields */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "var(--bg-secondary, #f8f8f4)",
        borderRadius: 16, padding: "20px 24px",
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, marginBottom: 14,
          color: "var(--text-color, #444)",
        }}>
          내용 편집
        </div>

        {[
          { label: "지역", value: customLocation, set: setCustomLocation, ph: "광주시 능평동" },
          { label: "내 목소리", value: customVoice, set: setCustomVoice, ph: "우리 동네 놀이터가 너무 낡았어요...", area: true },
          ...(mode === "withReply" ? [
            { label: "후보 이름", value: customCandidate, set: setCustomCandidate, ph: "김민수 후보" },
            { label: "후보 답변", value: customReply, set: setCustomReply, ph: "말씀 감사합니다. 개선 방안을...", area: true },
          ] : []),
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <label style={{
              fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #999)",
              display: "block", marginBottom: 4,
            }}>
              {f.label}
            </label>
            {f.area ? (
              <textarea
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                rows={2}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid var(--border-color, #e0ddd0)",
                  fontSize: 14, fontFamily: "inherit", resize: "vertical",
                  background: "var(--bg-color, #fff)",
                  color: "var(--text-color, #333)",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <input
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid var(--border-color, #e0ddd0)",
                  fontSize: 14, fontFamily: "inherit",
                  background: "var(--bg-color, #fff)",
                  color: "var(--text-color, #333)",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

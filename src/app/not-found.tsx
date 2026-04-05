export default function NotFoundPage() {
  return (
    <main
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          margin: 0,
        }}
      >
        여기 근데
      </h1>
      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          margin: 0,
        }}
      >
        요청하신 화면을 찾지 못했어요.
      </p>
    </main>
  );
}

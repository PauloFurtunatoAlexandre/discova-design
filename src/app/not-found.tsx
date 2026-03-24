export default function NotFound() {
  return (
    <div style={{ padding: "48px", textAlign: "center", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "64px", fontWeight: 300, marginBottom: "8px" }}>404</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>This page doesn't exist.</p>
      <a
        href="/"
        style={{
          padding: "12px 24px",
          background: "#E8C547",
          color: "#0C0C0F",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Go home
      </a>
    </div>
  );
}

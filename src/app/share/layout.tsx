// Public share layout — no auth, no sidebar.
// Used for: /share/[token] — the passcode-gated stakeholder view.
// ALWAYS forced to light theme — see design system spec.

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    // Force light theme on this layout regardless of user/system preference
    <div
      data-theme="light"
      className="min-h-screen bg-white text-gray-900"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  )
}

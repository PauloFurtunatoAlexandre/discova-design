import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/*
       * AppSidebar — persistent left navigation
       * Contains: workspace switcher area (top), phase nav (middle),
       * workspace switcher + avatar + settings (bottom)
       * See: src/components/layouts/AppSidebar.tsx
       */}
      {/* <AppSidebar /> */}

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

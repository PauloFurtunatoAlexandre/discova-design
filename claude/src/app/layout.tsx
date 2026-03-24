import type { Metadata } from "next"
import { Lora, DM_Sans, Geist } from "next/font/google"
import localFont from "next/font/local"
import "@/styles/globals.css"
import "@/styles/map-nodes.css"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

// JetBrains Mono — loaded via next/font/local or CDN
// Using Google Fonts version here for simplicity
// TODO: Replace with self-hosted for performance
const jetbrainsMono = localFont({
  src: [
    { path: "../../public/fonts/JetBrainsMono-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/JetBrainsMono-Medium.woff2", weight: "500" },
  ],
  variable: "--font-mono",
  display: "swap",
  // Fallback: CDN loaded in globals.css if self-hosted files aren't present
  fallback: ["'Courier New'", "monospace"],
})

export const metadata: Metadata = {
  title: {
    default: "Discova",
    template: "%s · Discova",
  },
  description:
    "The missing layer between what your users say and what your team decides to build.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(lora.variable, dmSans.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-body antialiased">
        {children}
      </body>
    </html>
  )
}

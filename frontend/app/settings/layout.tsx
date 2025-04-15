import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings | Allegiant Voice AI Dashboard",
  description: "Configure your system settings and preferences",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
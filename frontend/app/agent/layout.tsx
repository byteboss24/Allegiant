import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agent Configuration | Allegiant Voice AI Dashboard",
  description: "Configure your AI voice agent settings and parameters",
}

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
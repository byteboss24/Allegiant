import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Overview | Allegiant Voice AI Dashboard",
  description: "View your AI voice calling campaign overview and analytics",
}

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
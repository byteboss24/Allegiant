import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Call Recordings | Allegiant Voice AI Dashboard",
  description: "View and manage your AI voice call recordings",
}

export default function CallRecordingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
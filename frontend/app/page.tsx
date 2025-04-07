import type { Metadata } from "next"
import DashboardPage from "@/components/dashboard/dashboard-page"

export const metadata: Metadata = {
  title: "Voice AI Admin Dashboard",
  description: "Admin panel for managing AI voice calling campaigns",
}

export default function Home() {
  return <DashboardPage />
}

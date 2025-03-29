import type React from "react"
interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="grid items-start gap-8">
      <main className="grid gap-4 md:gap-8 w-full">{children}</main>
    </div>
  )
}


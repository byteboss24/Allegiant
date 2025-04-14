"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-center gap-40 p-3 relative border-b">
        <img 
          src="/mark.png" 
          alt="Allegiant Finance Services Logo" 
          className="h-12 w-auto absolute left-4"
        />
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-tight">Allegiant Voice AI Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your AI voice calling campaigns and view analytics.
          </p>
        </div>
      </div>

      <div className="flex-1">
        <div className="border-b">
          <nav className="flex h-16 items-center px-4">
            <ul className="flex items-center space-x-6">
              <li>
                <Link
                  href="/dashboard/overview"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard/overview"
                      ? "text-black dark:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/customers"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard/customers"
                      ? "text-black dark:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  Customers
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/calls"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard/calls"
                      ? "text-black dark:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  Call Recordings
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/agent"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard/agent"
                      ? "text-black dark:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  Agent
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <main className="flex-1 space-y-4 p-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-context"

const navItems = [
  {
    title: "Overview",
    href: "/overview",
  },
  {
    title: "Call Recordings",
    href: "/call-recordings",
  },
  {
    title: "Invoices",
    href: "/invoices",
  },
  {
    title: "Agent",
    href: "/agent",
  },
  {
    title: "Settings",
    href: "/settings",
  },
]

export function MainNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="flex items-center space-x-8 ml-auto">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-base font-medium transition-colors hover:text-[#2f3aa4] focus:text-[#2f3aa4] ${
            pathname === item.href
              ? "font-semibold text-[#2f3aa4]"
              : "text-muted-foreground"
          }`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 
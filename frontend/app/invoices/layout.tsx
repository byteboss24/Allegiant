import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invoices | Allegiant Voice AI Dashboard",
  description: "View and manage your customer invoices",
}

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
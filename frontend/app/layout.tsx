import type { Metadata } from 'next'
import './globals.css'
import { MainNav } from '@/components/nav/main-nav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Allegiant Voice AI Dashboard',
  description: 'Manage your AI voice calling campaigns and view analytics',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white shadow-sm">
          <div className="container flex h-20 items-center px-4">
            <Link href="/overview" className="flex items-center">
              <img
                src="/mark.png"
                alt="Allegiant Finance Services Logo"
                className="h-10 w-auto mr-6"
              />
            </Link>
            <MainNav />
          </div>
        </header>
        <main className="container mx-auto py-6">
          {children}
        </main>
      </body>
    </html>
  )
}

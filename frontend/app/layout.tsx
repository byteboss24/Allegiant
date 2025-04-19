import './globals.css'
import type { Metadata } from 'next'
import { MainNav } from '@/components/nav/main-nav'
import Link from 'next/link'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/nav/auth-context'

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
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="flex flex-col h-screen">
        <AuthProvider>
          <header className="border-b bg-white shadow-sm fixed top-0 left-0 right-0 z-50 flex justify-center">
            <div className="container flex h-20 items-center justify-between">
              <Link href="/overview" className="flex items-center">
                <img
                  src="/mark.png"
                  alt="Allegiant Finance Services Logo"
                  className="h-14 w-auto mr-6"
                />
              </Link>
              <MainNav />
            </div>
          </header>
          <main className="container mx-auto py-6 mt-20 flex-1">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}

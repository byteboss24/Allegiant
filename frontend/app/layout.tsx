import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Allegiant',
  description: 'Created with Ruslan',
  generator: 'ruslan',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex items-center justify-center gap-40 p-3">
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
        {children}
      </body>
    </html>
  )
}

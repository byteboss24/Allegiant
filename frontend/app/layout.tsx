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
      <body>{children}</body>
    </html>
  )
}

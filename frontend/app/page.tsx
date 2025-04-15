import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Voice AI Admin Dashboard",
  description: "Admin panel for managing AI voice calling campaigns",
}

export default function Home() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Allegiant Voice AI Admin Dashboard</h1>
        <ul className="space-y-2">
          <li><a className="text-blue-600 hover:underline" href="/overview">Overview</a></li>
          <li><a className="text-blue-600 hover:underline" href="/agent">Agent</a></li>
          <li><a className="text-blue-600 hover:underline" href="/call-recordings">Call Recordings</a></li>
          <li><a className="text-blue-600 hover:underline" href="/invoices">Invoices</a></li>
          <li><a className="text-blue-600 hover:underline" href="/settings">Settings</a></li>
        </ul>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { fetchRecentCalls as fetchRecentCallsApi } from "@/lib/apis"
import { RecentCall } from "@/lib/props"
import RecentCallItem from "./RecentCallItem";
import NoCalls from "./NoCalls";
import CenteredSpinner from "@/components/features/Dashboard/ActivitySection/CenteredSpinner";

export default function RecentCalls() {
  const [calls, setCalls] = useState<RecentCall[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentCalls = async () => {
      try {
        const data = await fetchRecentCallsApi()
        setCalls(data)
      } catch (error) {
        console.error('Failed to fetch recent calls:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentCalls()
  }, [])

  if (isLoading) return <CenteredSpinner />;
  if (!calls.length) return <NoCalls />;
  return (
    <div className="space-y-8">
      {calls.map((call) => (
        <RecentCallItem call={call} key={call.id} />
      ))}
    </div>
  );
}

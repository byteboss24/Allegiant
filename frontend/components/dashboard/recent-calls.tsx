"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {useState, useEffect} from "react"
import { fetchRecentCalls as fetchRecentCallsApi } from "@/lib/apis"
import { RecentCall } from "@/lib/props"

export function RecentCalls() {
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

  return (
    <div className="space-y-8">
      {calls.map((call) => (
        <div className="flex items-center" key={call.id}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{call.first_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{call.first_name+' '+call.last_name}</p>
            <p className="text-sm text-muted-foreground">
              {call.created_at} • {call.duration}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant={
                call.status === "completed" ? "default" : call.status === "connected" ? "outline" : "destructive"
              }
            >
              {call.status?.toUpperCase()}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

const recentCalls = [
  {
    id: "1",
    customer: {
      name: "John Smith",
      initials: "JS",
    },
    time: "10:24 AM",
    duration: "3m 12s",
    status: "Completed",
  },
  {
    id: "2",
    customer: {
      name: "Sarah Johnson",
      initials: "SJ",
    },
    time: "10:16 AM",
    duration: "2m 44s",
    status: "Connected",
  },
  {
    id: "3",
    customer: {
      name: "Michael Brown",
      initials: "MB",
    },
    time: "10:12 AM",
    duration: "0m 32s",
    status: "Failed",
  },
  {
    id: "4",
    customer: {
      name: "Emma Wilson",
      initials: "EW",
    },
    time: "10:08 AM",
    duration: "4m 17s",
    status: "Completed",
  },
  {
    id: "5",
    customer: {
      name: "David Taylor",
      initials: "DT",
    },
    time: "9:52 AM",
    duration: "1m 08s",
    status: "Connected",
  },
]


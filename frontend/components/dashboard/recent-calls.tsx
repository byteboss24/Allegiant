"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function RecentCalls() {
  return (
    <div className="space-y-8">
      {recentCalls.map((call) => (
        <div className="flex items-center" key={call.id}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{call.customer.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{call.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {call.time} • {call.duration}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant={
                call.status === "Completed" ? "default" : call.status === "Connected" ? "outline" : "destructive"
              }
            >
              {call.status}
            </Badge>
            <Button variant="ghost" size="sm">
              Details
            </Button>
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


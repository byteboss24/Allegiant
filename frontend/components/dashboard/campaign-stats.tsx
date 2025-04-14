"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MonthlyStats {
  total_invoices: number
  completed_invoices: number
  completion_rate: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export function CampaignStats() {
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/invoices/month`)
        const data = await response.json()
        if (data) {
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch monthly stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (!stats) return <div>No data available</div>
  return (
    <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{"April"}</h3>
                  <p className="text-sm text-muted-foreground">Outstanding invoices from April {""}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{stats.completion_rate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed_invoices}/{stats.total_invoices} calls
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={stats.completion_rate} className="h-2" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-medium">289</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <div>
                  <p className="font-medium">124</p>
                  <p className="text-xs text-muted-foreground">Transferred</p>
                </div>
                <div>
                  <p className="font-medium">165</p>
                  <p className="text-xs text-muted-foreground">SMS Sent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    </div>
  )
}


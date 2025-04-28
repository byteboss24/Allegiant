"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchMonthlyStats } from "@/lib/apis"

import type { MonthlyStats } from "@/lib/props"

const CampaignStats = () => {
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetchMonthlyStats()
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
                <h3 className="font-semibold">{new Date().toLocaleString('default', { month: 'long' })}</h3>
                <p className="text-sm text-muted-foreground">Outstanding invoices from {new Date().toLocaleString('default', { month: 'long' })}</p>
              </div>
              <div className="text-right">
                <p className="font-medium font-semibold">{stats.completion_rate}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats.completed_invoices}/{stats.total_invoices} calls
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={stats.completion_rate} className="h-2" color="#03C3EC"/>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm text-[14px]">
              <div>
                <p className="text-[#7477FF]">{stats.total_calls || 0} Connected</p>
              </div>
              <div>
                <p className="text-[#70DC37]">{(stats.completed_calls + stats.sms_sent_calls) || 0} Transferred</p>
              </div>
              <div>
                <p className="text-[#ED9C39]">{stats.sms_sent_calls || 0} SMS Sent</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CampaignStats;

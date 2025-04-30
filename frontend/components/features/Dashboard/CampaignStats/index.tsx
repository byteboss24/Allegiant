"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import CampaignStatsHeader from "./CampaignStatsHeader";
import CampaignStatsProgress from "./CampaignStatsProgress";
import CampaignStatsGrid from "./CampaignStatsGrid";
import NoData from "./NoData";
import CenteredSpinner from "@/components/features/Dashboard/ActivitySection/CenteredSpinner";
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

  if (isLoading) return <CenteredSpinner />
  if (!stats) return <NoData />
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6">
            <CampaignStatsHeader
              month={new Date().toLocaleString('default', { month: 'long' })}
              completionRate={stats.completion_rate}
              completedInvoices={stats.completed_invoices}
              totalInvoices={stats.total_invoices}
            />
            <div className="mt-4">
              <CampaignStatsProgress value={stats.completion_rate} />
            </div>
            <CampaignStatsGrid
              totalCalls={stats.total_calls}
              transferredCalls={stats.completed_calls + stats.sms_sent_calls}
              smsSent={stats.sms_sent_calls}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CampaignStats;

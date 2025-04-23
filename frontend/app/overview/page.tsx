"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Overview } from "@/components/dashboard/overview"
import { RecentCalls } from "@/components/dashboard/recent-calls"
import { CampaignStats } from "@/components/dashboard/campaign-stats"
import { Spinner } from "@/components/ui/spinner"
import { fetchTodayStatus as fetchTodayStatusApi, fetchWeeklyStats, fetchYesterdayStatus } from "@/lib/apis"
import type { TodayStatus, WeeklyStats } from "@/lib/props"

export default function OverviewPage() {
  const [todayStatus, setTodayStatus] = useState<null | TodayStatus>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[] | null>(null)
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true)
  const [yesterdayStatus, setYesterdayStatus] = useState<null | TodayStatus>(null)
  const [isYesterdayLoading, setIsYesterdayLoading] = useState(true)

  useEffect(() => {
    async function fetchTodayStatus() {
      try {
        setIsLoading(true)
        const data = await fetchTodayStatusApi()
        setTodayStatus(data)
      } catch (error) {
        console.error("Error fetching today's status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTodayStatus()
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsWeeklyLoading(true)
        const data = await fetchWeeklyStats()
        setWeeklyStats(data)
      } catch (error) {
        console.error("Error fetching weekly stats:", error)
      } finally {
        setIsWeeklyLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchYesterday() {
      try {
        setIsYesterdayLoading(true)
        const data = await fetchYesterdayStatus()
        setYesterdayStatus(data)
      } catch (error) {
        console.error("Error fetching yesterday's status:", error)
      } finally {
        setIsYesterdayLoading(false)
      }
    }
    fetchYesterday()
  }, [])

  // Calculate last week's average total call count
  const lastWeekAvgTotal = weeklyStats && weeklyStats.length > 0
    ? weeklyStats.reduce((sum, stat) => sum + (stat.total_calls || 0), 0) / weeklyStats.length
    : 0

  // Calculate last week's average completed call count
  const lastWeekAvgCompleted = weeklyStats && weeklyStats.length > 0
    ? weeklyStats.reduce((sum, stat) => sum + (stat.completed_calls || 0), 0) / weeklyStats.length
    : 0

  // Calculate today's completed calls over last week's average (as percentage)
  const completedOverAvg = lastWeekAvgCompleted > 0 && todayStatus
    ? ((todayStatus.completed_calls / lastWeekAvgCompleted) * 100).toFixed(2)
    : "0.00"

  // Calculate today's total calls over yesterday's total calls (as percentage)
  const todayOverYesterday = yesterdayStatus && yesterdayStatus.total_calls > 0 && todayStatus
    ? ((todayStatus.total_calls / yesterdayStatus.total_calls) * 100).toFixed(2)
    : "0.00"

  // Calculate today's total calls over last week's average total calls (as percentage)
  const todayOverLastWeekAvg = lastWeekAvgTotal > 0 && todayStatus
    ? ((todayStatus.total_calls / lastWeekAvgTotal) * 100).toFixed(2)
    : "0.00"

  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Overview</h1>
        <DashboardShell>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </CardHeader>
              <CardContent>
                {isLoading || isYesterdayLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{todayStatus?.total_calls || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {`Today / Yesterday: ${todayOverYesterday}% | Today / Last Week Avg: ${todayOverLastWeekAvg}%`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Calls vs Last Week Avg</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></svg>
              </CardHeader>
              <CardContent>
                {isLoading || isWeeklyLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{completedOverAvg}%</div>
                    <p className="text-xs text-muted-foreground">Today's completed calls / last week's avg completed calls</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Rate</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </CardHeader>
              <CardContent>
                {(isLoading || isWeeklyLoading) ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{(((todayStatus?.completed_calls || 0) / (todayStatus?.total_calls || 0.01)) * 100)?.toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground">{completedOverAvg}% of last week's avg completed calls</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <Overview />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>You made {todayStatus?.total_calls || 0} calls today</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <RecentCalls />
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Active campaign statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <CampaignStats />
                )}
              </CardContent>
            </Card>
          </div>
        </DashboardShell>
      </div>
    </>
  )
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Overview } from "@/components/dashboard/Overview";
import { RecentCalls } from "@/components/dashboard/RecentCalls";
import { CampaignStats } from "@/components/dashboard/campaign-stats";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchTodayStatus,
  fetchWeeklyStats,
  fetchYesterdayStatus,
} from "@/lib/apis";
import type { TodayStatus, WeeklyStats } from "@/lib/props";

export default function OverviewPage() {
  const [todayStatus, setTodayStatus] = useState<null | TodayStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [yesterdayStatus, setYesterdayStatus] = useState<null | TodayStatus>(
    null
  );
  const [isYesterdayLoading, setIsYesterdayLoading] = useState(true);

  useEffect(() => {
    async function fetchToday() {
      try {
        setIsLoading(true);
        const data = await fetchTodayStatus();
        setTodayStatus(data);
      } catch (error) {
        console.error("Error fetching today's status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchStats() {
      try {
        setIsWeeklyLoading(true);
        const data = await fetchWeeklyStats();
        setWeeklyStats(data);
      } catch (error) {
        console.error("Error fetching weekly stats:", error);
      } finally {
        setIsWeeklyLoading(false);
      }
    }

    async function fetchYesterday() {
      try {
        setIsYesterdayLoading(true);
        const data = await fetchYesterdayStatus();
        setYesterdayStatus(data);
      } catch (error) {
        console.error("Error fetching yesterday's status:", error);
      } finally {
        setIsYesterdayLoading(false);
      }
    }

    fetchToday();
    fetchYesterday();
    fetchStats();
  }, []);

  // Calculate last week's average total call count
  const lastWeekAvgTotal =
    weeklyStats && weeklyStats.length > 0
      ? weeklyStats.reduce((sum, stat) => sum + (stat.total_calls || 0), 0) /
        weeklyStats.length
      : 0;

  // Calculate last week's average completed call count
  const lastWeekAvgCompleted =
    weeklyStats && weeklyStats.length > 0
      ? weeklyStats.reduce(
          (sum, stat) => sum + (stat.completed_calls || 0),
          0
        ) / weeklyStats.length
      : 0;

  // Calculate today's completed calls over last week's average (as percentage)
  const completedOverAvg =
    lastWeekAvgCompleted > 0 && todayStatus
      ? ((todayStatus.completed_calls / lastWeekAvgCompleted) * 100).toFixed(2)
      : "0.00";

  // Calculate today's total calls over yesterday's total calls (as percentage)
  const todayOverYesterday =
    yesterdayStatus && yesterdayStatus.total_calls > 0 && todayStatus
      ? ((todayStatus.total_calls / yesterdayStatus.total_calls) * 100).toFixed(
          2
        )
      : "0.00";

  // Calculate today's total calls over last week's average total calls (as percentage)
  const todayOverLastWeekAvg =
    lastWeekAvgTotal > 0 && todayStatus
      ? ((todayStatus.total_calls / lastWeekAvgTotal) * 100).toFixed(2)
      : "0.00";

  return (
    <>
      <div className="container mx-auto py-8">
        <DashboardShell>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m4 0h-1v-4h-1m-4 0h-1v-4h-1"
              />
            </svg>
            Overview
          </h1>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-blue-50 to-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
                <CardTitle className="text-base font-semibold text-blue-700">
                  Total Calls Today
                </CardTitle>
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-blue-500"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                {isLoading || isYesterdayLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-blue-600 mb-1">
                      {todayStatus?.total_calls || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {`Today / Yesterday: `}
                      <span className="font-semibold text-blue-500">
                        {todayOverYesterday}%
                      </span>
                      {` | Today / Last Week Avg: `}
                      <span className="font-semibold text-blue-500">
                        {todayOverLastWeekAvg}%
                      </span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-green-50 to-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
                <CardTitle className="text-base font-semibold text-green-700">
                  Completed Calls vs Last Week Avg
                </CardTitle>
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-green-500"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                {isLoading || isWeeklyLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-green-600 mb-1">
                      {completedOverAvg}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Today's completed calls / last week's avg completed calls
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-purple-50 to-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
                <CardTitle className="text-base font-semibold text-purple-700">
                  Connection Rate
                </CardTitle>
                <div className="bg-purple-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-5 w-5 text-purple-500"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                {isLoading || isWeeklyLoading ? (
                  <div className="flex justify-center py-2">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-purple-600 mb-1">
                      {(
                        ((todayStatus?.completed_calls || 0) /
                          (todayStatus?.total_calls || 0.01)) *
                        100
                      )?.toFixed(2)}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-purple-500">
                        {completedOverAvg}%
                      </span>{" "}
                      of last week's avg completed calls
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h18M3 12h18M3 17h18"
                />
              </svg>
              Activity
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 rounded-2xl border-0 bg-white/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.18),0_2px_8px_0_rgba(0,0,0,0.10)] transition-shadow">
                <CardHeader className="px-4 pt-3 pb-1">
                  <CardTitle className="text-lg font-semibold text-blue-700">
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-2 px-4 pb-3 pt-1">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <Overview />
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-3 rounded-2xl border-0 bg-white/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.18),0_2px_8px_0_rgba(0,0,0,0.10)] transition-shadow">
                <CardHeader className="px-4 pt-3 pb-1">
                  <CardTitle className="text-lg font-semibold text-blue-700">
                    Recent Calls
                  </CardTitle>
                  <CardDescription className="text-blue-400">
                    You made {todayStatus?.total_calls || 0} calls today
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-1">
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
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12l2 2 4-4"
                />
              </svg>
              Campaign Performance
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
              <Card className="col-span-1 rounded-2xl border-0 bg-gradient-to-br from-[#e0f7fa] to-white shadow-[0_8px_32px_0_rgba(0,0,0,0.18),0_2px_8px_0_rgba(0,0,0,0.10)] transition-shadow">
                <CardHeader className="px-4 pt-3 pb-1">
                  <CardTitle
                    className="text-lg font-semibold"
                    style={{ color: "#03C3EC" }}
                  >
                    Campaign Performance
                  </CardTitle>
                  <CardDescription className="" style={{ color: "#03C3EC" }}>
                    Active campaign statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-1">
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
          </div>
        </DashboardShell>
      </div>
    </>
  );
}

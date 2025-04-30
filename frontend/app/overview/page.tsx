"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/features/Dashboard/DashboardShell";
import {
  fetchTodayStatus,
  fetchWeeklyStats,
  fetchYesterdayStatus,
} from "@/lib/apis";
import type { TodayStatus, WeeklyStats } from "@/lib/props";
import { OverviewHeader } from "@/components/features/Dashboard/OverviewHeader";
import { StatsCards } from "@/components/features/Dashboard/StatsCards";
import { ActivitySection } from "@/components/features/Dashboard/ActivitySection";
import { CampaignPerformanceSection } from "@/components/features/Dashboard/CampaignPerformance";

export default function OverviewPage() {
  const [todayStatus, setTodayStatus] = useState<null | TodayStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[] | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [yesterdayStatus, setYesterdayStatus] = useState<null | TodayStatus>(null);
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

  const lastWeekAvgTotal =
    weeklyStats && weeklyStats.length > 0
      ? weeklyStats.reduce((sum, stat) => sum + (stat.total_calls || 0), 0) / weeklyStats.length : 0;

  const lastWeekAvgCompleted =
    weeklyStats && weeklyStats.length > 0
      ? weeklyStats.reduce(
          (sum, stat) => sum + (stat.completed_calls || 0), 0) / weeklyStats.length : 0;

  const completedOverAvg =
    lastWeekAvgCompleted > 0 && todayStatus
      ? ((todayStatus.completed_calls / lastWeekAvgCompleted) * 100).toFixed(2)
      : "0.00";

  const todayOverYesterday =
    yesterdayStatus && yesterdayStatus.total_calls > 0 && todayStatus
      ? ((todayStatus.total_calls / yesterdayStatus.total_calls) * 100).toFixed(2)
      : "0.00";

  const todayOverLastWeekAvg =
    lastWeekAvgTotal > 0 && todayStatus
      ? ((todayStatus.total_calls / lastWeekAvgTotal) * 100).toFixed(2) : "0.00";

  return (
    <>
      <div className="container mx-auto py-8">
        <DashboardShell>
          <OverviewHeader />
          <StatsCards
            isLoading={isLoading}
            isYesterdayLoading={isYesterdayLoading}
            isWeeklyLoading={isWeeklyLoading}
            todayStatus={todayStatus}
            yesterdayStatus={yesterdayStatus}
            todayOverYesterday={todayOverYesterday}
            todayOverLastWeekAvg={todayOverLastWeekAvg}
            completedOverAvg={completedOverAvg}
          />
          <ActivitySection isLoading={isLoading} todayStatus={todayStatus} />
          <CampaignPerformanceSection isLoading={isLoading} />
        </DashboardShell>
      </div>
    </>
  );
}

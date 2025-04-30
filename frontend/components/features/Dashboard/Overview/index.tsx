"use client"

import { fetchWeeklyStats } from "@/lib/apis";
import { useEffect, useState } from "react"
import Loading from "./Loading";
import WeeklyStatsBarChart from "./WeeklyStatsBarChart";

type ChartData = { date: string; total: number; connected: number; other: number };

export default function Overview() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const weekData = await fetchWeeklyStats()
        
        // Transform the data for the chart
        const formattedData = weekData.map((item) => ({
          date: item.date,
          total: item.total_calls,
          connected: item.completed_calls,
          other: item.other_calls,
        }))
        
        setData(formattedData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <Loading />
  }
  return <WeeklyStatsBarChart data={data} />
}

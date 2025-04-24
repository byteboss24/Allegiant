"use client"

import { fetchWeeklyStats } from "@/lib/apis";
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { WeeklyStats } from "@/lib/props"

export function Overview() {
  const [data, setData] = useState<WeeklyStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const weekData = await fetchWeeklyStats()
        
        // Transform the data for the chart
        const formattedData = weekData.map((item: WeeklyStats) => ({
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
    return <div>Loading...</div>
  }
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} name="Total Calls" />
        <Bar dataKey="connected" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Connected" />
      </BarChart>
    </ResponsiveContainer>
  )
}


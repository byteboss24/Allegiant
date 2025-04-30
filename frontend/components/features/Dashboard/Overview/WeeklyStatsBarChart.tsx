import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface WeeklyStatsBarChartProps {
  data: { date: string; total: number; connected: number; other: number }[];
}

export default function WeeklyStatsBarChart({ data }: WeeklyStatsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="#696CFF" radius={[4, 4, 0, 0]} name="Total Calls" />
        <Bar dataKey="connected" fill="#22c55e" radius={[4, 4, 0, 0]} name="Connected" />
        <Bar dataKey="other" fill="#a3a3a3" radius={[4, 4, 0, 0]} name="Other" />
      </BarChart>
    </ResponsiveContainer>
  );
}

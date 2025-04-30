import StatCard from "./StatCard";
import { PhoneIcon } from "@/components/icons/PhoneIcon";
import { MonitorIcon } from "@/components/icons/MonitorIcon";
import { UsersIcon } from "@/components/icons/UsersIcon";

interface StatsCardsProps {
  isLoading: boolean;
  isYesterdayLoading: boolean;
  isWeeklyLoading: boolean;
  todayStatus: { total_calls: number; completed_calls: number } | null;
  yesterdayStatus: { total_calls: number } | null;
  todayOverYesterday: string;
  todayOverLastWeekAvg: string;
  completedOverAvg: string;
}

export function StatsCards({
  isLoading,
  isYesterdayLoading,
  isWeeklyLoading,
  todayStatus,
  yesterdayStatus,
  todayOverYesterday,
  todayOverLastWeekAvg,
  completedOverAvg,
}: StatsCardsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <StatCard
        title="Total Calls Today"
        icon={<PhoneIcon />}
        isLoading={isLoading || isYesterdayLoading}
      >
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
      </StatCard>
      <StatCard
        title="Completed Calls vs Last Week Avg"
        icon={<MonitorIcon />}
        isLoading={isLoading || isWeeklyLoading}
      >
        <div className="text-3xl font-extrabold text-green-600 mb-1">
          {completedOverAvg}%
        </div>
        <p className="text-xs text-muted-foreground">
          Today's completed calls / last week's avg completed calls
        </p>
      </StatCard>
      <StatCard
        title="Connection Rate"
        icon={<UsersIcon />}
        isLoading={isLoading || isWeeklyLoading}
      >
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
      </StatCard>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
      {/* Total Calls Today */}
      <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-blue-50 to-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-base font-semibold text-blue-700">
            Total Calls Today
          </CardTitle>
          <div className="bg-blue-100 p-2 rounded-full">
            <PhoneIcon />
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
      {/* Completed Calls vs Last Week Avg */}
      <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-green-50 to-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-base font-semibold text-green-700">
            Completed Calls vs Last Week Avg
          </CardTitle>
          <div className="bg-green-100 p-2 rounded-full">
            <MonitorIcon />
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
      {/* Connection Rate */}
      <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-purple-50 to-white border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
          <CardTitle className="text-base font-semibold text-purple-700">
            Connection Rate
          </CardTitle>
          <div className="bg-purple-100 p-2 rounded-full">
            <UsersIcon />
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
  );
} 
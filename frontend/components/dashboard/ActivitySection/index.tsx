import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { MenuIcon } from "@/components/icons/MenuIcon";
import Overview from "@/components/Dashboard/Overview";
import RecentCalls from "@/components/Dashboard/RecentCalls";

interface ActivitySectionProps {
  isLoading: boolean;
  todayStatus: { total_calls: number } | null;
}

export function ActivitySection({ isLoading, todayStatus }: ActivitySectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MenuIcon />
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
  );
} 
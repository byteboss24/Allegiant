import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CenteredSpinner from "./CenteredSpinner";
import RecentCalls from "@/components/Dashboard/RecentCalls";

interface RecentCallsCardProps {
  isLoading: boolean;
  todayStatus: { total_calls: number } | null;
}

export default function RecentCallsCard({ isLoading, todayStatus }: RecentCallsCardProps) {
  return (
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
        {isLoading ? <CenteredSpinner /> : <RecentCalls />}
      </CardContent>
    </Card>
  );
}

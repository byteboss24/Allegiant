import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenteredSpinner from "./CenteredSpinner";
import Overview from "@/components/features/Dashboard/Overview";

interface OverviewCardProps {
  isLoading: boolean;
}

export default function OverviewCard({ isLoading }: OverviewCardProps) {
  return (
    <Card className="col-span-4 rounded-2xl border-0 bg-white/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.18),0_2px_8px_0_rgba(0,0,0,0.10)] transition-shadow">
      <CardHeader className="px-4 pt-3 pb-1">
        <CardTitle className="text-lg font-semibold text-blue-700">
          Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2 px-4 pb-3 pt-1">
        {isLoading ? <CenteredSpinner /> : <Overview />}
      </CardContent>
    </Card>
  );
}

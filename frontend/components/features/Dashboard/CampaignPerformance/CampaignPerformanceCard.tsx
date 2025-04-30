import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CenteredSpinner from "@/components/features/Dashboard/ActivitySection/CenteredSpinner";
import CampaignStats from "@/components/features/Dashboard/CampaignStats";

interface CampaignPerformanceCardProps {
  isLoading: boolean;
}

export default function CampaignPerformanceCard({ isLoading }: CampaignPerformanceCardProps) {
  return (
    <Card className="col-span-1 rounded-2xl border-0 bg-gradient-to-br from-[#e0f7fa] to-white shadow-[0_8px_32px_0_rgba(0,0,0,0.18),0_2px_8px_0_rgba(0,0,0,0.10)] transition-shadow">
      <CardHeader className="px-4 pt-3 pb-1">
        <CardTitle className="text-lg font-semibold" style={{ color: "#03C3EC" }}>
          Campaign Performance
        </CardTitle>
        <CardDescription className="" style={{ color: "#03C3EC" }}>
          Active campaign statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-1">
        {isLoading ? <CenteredSpinner /> : <CampaignStats />}
      </CardContent>
    </Card>
  );
}

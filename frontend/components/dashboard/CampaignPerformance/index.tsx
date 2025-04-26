import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon";
import CampaignStats from "@/components/dashboard/CampaignStats";

interface CampaignPerformanceSectionProps {
  isLoading: boolean;
}

export function CampaignPerformanceSection({ isLoading }: CampaignPerformanceSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CheckCircleIcon />
        Campaign Performance
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <CampaignStats />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
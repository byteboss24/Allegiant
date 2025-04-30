import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon";
import CampaignStats from "@/components/Dashboard/CampaignStats";
import CampaignPerformanceHeader from "./CampaignPerformanceHeader";
import CampaignPerformanceCard from "./CampaignPerformanceCard";

interface CampaignPerformanceSectionProps {
  isLoading: boolean;
}

export function CampaignPerformanceSection({ isLoading }: CampaignPerformanceSectionProps) {
  return (
    <div>
      <CampaignPerformanceHeader />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
        <CampaignPerformanceCard isLoading={isLoading} />
      </div>
    </div>
  );
} 
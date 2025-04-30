import { Progress } from "@/components/ui/progress";

interface CampaignStatsProgressProps {
  value: number;
}

export default function CampaignStatsProgress({ value }: CampaignStatsProgressProps) {
  return <Progress value={value} className="h-2" color="#03C3EC" />;
}

import ActivitySectionHeader from "./ActivitySectionHeader";
import OverviewCard from "./OverviewCard";
import RecentCallsCard from "./RecentCallsCard";

interface ActivitySectionProps {
  isLoading: boolean;
  todayStatus: { total_calls: number } | null;
}

export function ActivitySection({ isLoading, todayStatus }: ActivitySectionProps) {
  return (
    <div className="mb-8">
      <ActivitySectionHeader />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <OverviewCard isLoading={isLoading} />
        <RecentCallsCard isLoading={isLoading} todayStatus={todayStatus} />
      </div>
    </div>
  );
}
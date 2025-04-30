import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import CenteredSpinner from "@/components/Dashboard/ActivitySection/CenteredSpinner";
import StatCardHeader from "./StatCardHeader";

interface StatCardProps {
  title: string;
  icon: ReactNode;
  isLoading: boolean;
  children: ReactNode;
}

export default function StatCard({ title, icon, isLoading, children }: StatCardProps) {
  return (
    <Card className="rounded-2xl shadow-lg transition-transform hover:scale-[1.025] hover:shadow-2xl bg-gradient-to-br from-blue-50 to-white border-0">
      <StatCardHeader title={title} icon={icon} />
      <CardContent className="px-4 pb-3 pt-1">
        {isLoading ? <CenteredSpinner /> : children}
      </CardContent>
    </Card>
  );
}

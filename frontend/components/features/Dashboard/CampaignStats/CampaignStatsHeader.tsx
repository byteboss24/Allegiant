interface CampaignStatsHeaderProps {
  month: string;
  completionRate: number;
  completedInvoices: number;
  totalInvoices: number;
}

export default function CampaignStatsHeader({ month, completionRate, completedInvoices, totalInvoices }: CampaignStatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{month}</h3>
        <p className="text-sm text-muted-foreground">Outstanding invoices from {month}</p>
      </div>
      <div className="text-right">
        <p className="font-medium font-semibold">{completionRate}%</p>
        <p className="text-xs text-muted-foreground">
          {completedInvoices}/{totalInvoices} calls
        </p>
      </div>
    </div>
  );
}

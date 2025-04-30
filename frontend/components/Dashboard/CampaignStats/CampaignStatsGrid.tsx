interface CampaignStatsGridProps {
  totalCalls: number;
  transferredCalls: number;
  smsSent: number;
}

export default function CampaignStatsGrid({ totalCalls, transferredCalls, smsSent }: CampaignStatsGridProps) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm text-[14px]">
      <div>
        <p className="text-[#7477FF]">{totalCalls || 0} Connected</p>
      </div>
      <div>
        <p className="text-[#70DC37]">{transferredCalls || 0} Transferred</p>
      </div>
      <div>
        <p className="text-[#ED9C39]">{smsSent || 0} SMS Sent</p>
      </div>
    </div>
  );
}

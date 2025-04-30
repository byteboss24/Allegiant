import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RecentCall } from "@/lib/datatypes";

interface RecentCallItemProps {
  call: RecentCall;
}

export default function RecentCallItem({ call }: RecentCallItemProps) {
  return (
    <div className="flex items-center" key={call.id}>
      <Avatar className="h-9 w-9">
        <AvatarFallback>{call.first_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="ml-4 space-y-1">
        <p className="text-sm font-medium leading-none">{call.first_name + ' ' + call.last_name}</p>
        <p className="text-sm text-muted-foreground">
          {call.created_at} • {call.duration}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {call.status?.toUpperCase() === "SMS" ? (
          <Badge variant="secondary">CALLED</Badge>
        ) : null}
        <Badge
          variant={
            call.status === "completed" || call.status === "sms"
              ? "secondary"
              : call.status === "connected"
              ? "outline"
              : "destructive"
          }
        >
          {call.status?.toUpperCase() === "COMPLETED"
            ? "CALLED"
            : call.status?.toUpperCase() === "SMS"
            ? "SMS Sent"
            : call.status?.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

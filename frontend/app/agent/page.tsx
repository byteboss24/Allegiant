import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AgentConfig from "@/components/features/Agent/AgentConfig";
import AgentPageHeader from "@/components/features/Agent/Header";

export default function AgentPage() {
  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-background dark:via-background dark:to-blue-950 flex items-center justify-center z-0" />
      <div className="container mx-auto relative z-10">
        <Card className="shadow-xl rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-background/80 backdrop-blur">
          <AgentPageHeader />
          <Separator className="my-2" />
          <AgentConfig />
        </Card>
      </div>
    </>
  );
}

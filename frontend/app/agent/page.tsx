import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AgentConfig from "@/components/features/Agent/AgentConfig";
import AgentPageHeader from "@/components/features/Agent/Header";

export default function AgentPage() {
  return (
    <>
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

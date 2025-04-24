import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkle } from "lucide-react";
import { AgentConfig } from "@/components/agent/agent-config";

export default function AgentPage() {
  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-background dark:via-background dark:to-blue-950 flex items-center justify-center z-0" />
      <div className="container mx-auto relative z-10">
        <Card className="shadow-xl rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-background/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Sparkle className="text-blue-500 dark:text-blue-300 w-6 h-6" />
              </span>
              <CardTitle className="text-xl font-bold">
                Agent Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI voice agent settings and parameters
              </CardDescription>
            </div>
          </CardHeader>
          <Separator className="my-2" />
          <AgentConfig />
        </Card>
      </div>
    </>
  );
}

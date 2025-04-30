import { Sparkle } from "lucide-react";

export default function CallRecordingsHeader() {
  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 dark:bg-blue-900">
          <Sparkle className="text-blue-500 dark:text-blue-300 w-6 h-6" />
        </span>
        <span>
          <div className="text-xl font-bold">Call Recordings</div>
          <div className="text-muted-foreground text-sm">
            Listen to and analyze your AI voice call recordings.
          </div>
        </span>
      </div>
    </div>
  );
}

import { Spinner } from "@/components/ui/spinner";

export default function CenteredSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Spinner size="lg" />
    </div>
  );
}

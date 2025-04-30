import { CustomersList } from "@/components/features/Customers/CustomersList";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import InvoicesHeader from "../../components/features/Customers/Header";

export default function InvoicesPage() {
  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-background dark:via-background dark:to-blue-950 flex items-center justify-center" />
      <div className="container mx-auto">
        <Card className="shadow-xl rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-background/80 backdrop-blur">
          <InvoicesHeader />
          <Separator className="my-2" />
          <CardContent className="p-0 sm:p-6">
            <CustomersList />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

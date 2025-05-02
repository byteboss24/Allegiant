"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { fetchCustomerDetails as fetchCustomerDetailsApi, fetchRecords } from "@/lib/apis";
import type { Invoice, CallRecordingItem } from "@/lib/datatypes";
import CallHistoryTable from "@/components/features/Calls/CallHistoryTable";
import { DetailsSection } from "./DetailsSection";

function useCallRecordingsMinimal() {
  const [callRecordings, setCallRecordings] = useState<CallRecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRecords(1, 100, "", "all")
      .then((data: { items: CallRecordingItem[] }) => {
        setCallRecordings(data.items);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch recordings.");
        setLoading(false);
      });
  }, []);
  return { callRecordings, loading, error };
}

export function CustomerDetails() {
  const router = useRouter();
  const { invoice_number } = useParams();

  const {
    callRecordings,
    loading,
    error,
  } = useCallRecordingsMinimal();

  const [customer, setCustomer] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await fetchCustomerDetailsApi(invoice_number as string);
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer details:", error);
        toast.error("Failed to load customer details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoice_number) {
      fetchDetails();
    }
  }, [invoice_number]);

  const filteredCallRecordings = useMemo(
    () => callRecordings.filter(
      (call) => call.invoice_number === customer?.invoice_number
    ),
    [callRecordings, customer?.invoice_number]
  );

  const handleBack = useCallback(() => router.back(), [router]);

  // Memoized Call History Section
  const CallHistorySection = useCallback(() => (
    <TabsContent value="calls">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Call History</h3>
        <CallHistoryTable
          callRecordings={filteredCallRecordings}
          loading={loading}
          error={error}
        />
      </CardContent>
    </TabsContent>
  ), [filteredCallRecordings, loading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Customer not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-primary hover:text-primary-700 hover:bg-primary/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </Button>
        <Card className="shadow-2xl rounded-2xl border-0">
          <Tabs defaultValue="details" className="w-full">
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-primary" /> Customer
                    Details
                  </CardTitle>
                  <CardDescription className="text-base text-gray-500">
                    View and manage customer information
                  </CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="calls">Call History</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <DetailsSection customer={customer} />
            <CallHistorySection />
          </Tabs>
        </Card>
      </div>
    </>
  );
}

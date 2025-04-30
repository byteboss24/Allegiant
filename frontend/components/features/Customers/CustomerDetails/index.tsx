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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Calendar,
  DollarSign,
  Landmark,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  User as UserIcon,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchCustomerDetails as fetchCustomerDetailsApi, fetchRecords } from "@/lib/apis";
import type { Invoice, CallRecordingItem } from "@/lib/datatypes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CallHistoryTable from "@/components/features/Calls/CallHistoryTable";

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

  const DetailsSection = useCallback(() => (
    <TabsContent value="details">
      <CardContent className="space-y-10 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4" /> Name
              </h3>
              <p className="text-xl font-semibold text-gray-800">{`${customer?.first_name} ${customer?.last_name}`}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4" /> Contact Information
              </h3>
              <div className="space-y-1 text-gray-700">
                <p className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400" /> Mobile: {customer?.mobile_number}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Phone: {customer?.phone_number}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email: {customer?.email}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> Address
              </h3>
              <p className="text-gray-700">Postcode: {customer?.mailing_postcode}</p>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" /> Invoice Information
              </h3>
              <div className="space-y-1 text-gray-700">
                <p className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" /> Invoice Number: <span className="font-medium">{customer?.invoice_number}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Invoice Date: {customer?.invoice_date}
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" /> Amount: <span className="font-medium">{customer?.invoice_amount}</span>
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-500" /> Outstanding: <span className="font-semibold text-yellow-600">{customer?.outstanding_amount}</span>
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4" /> FSP Information
              </h3>
              <div className="space-y-1 text-gray-700">
                <p className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-gray-400" /> FSP Name: {customer?.fsp_name}
                </p>
                <p className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" /> Claim Reference: {customer?.claim_reference}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  {customer?.status === "completed2" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : customer?.status === "pending" ||
                    customer?.status === "completed" ||
                    customer?.status === "sms" ? (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )} Status
                </h3>
                <Badge
                  variant={
                    customer?.status === "completed2"
                      ? "default"
                      : customer?.status === "pending" ||
                        customer?.status === "completed" ||
                        customer?.status === "sms"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-base px-4 py-1 rounded-full tracking-wide"
                >
                  {customer?.status?.toUpperCase() === "SMS"
                    ? "SMS Sent"
                    : customer?.status?.toUpperCase() === "COMPLETED"
                    ? "CALLED"
                    : customer?.status?.toUpperCase() === "COMPLETED2"
                    ? "COMPLETED"
                    : customer?.status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </TabsContent>
  ), [customer]);

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
            <DetailsSection />
            <CallHistorySection />
          </Tabs>
        </Card>
      </div>
    </>
  );
}

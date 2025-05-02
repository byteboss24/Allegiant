import { CheckCircle2, Clock, UserIcon, XCircle, Smartphone, Phone, Mail, MapPin, DollarSign, ClipboardList, Calendar, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

interface DetailsSectionProps {
  customer: {
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
    phone_number?: string;
    email?: string;
    mailing_postcode?: string;
    invoice_number?: string;
    invoice_date?: string;
    invoice_amount?: string;
    outstanding_amount?: string;
    fsp_name?: string;
    claim_reference?: string;
    status?: string;
  };
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({ customer }) => {
  return (
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
                  {customer?.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : customer?.status === "pending" ||
                    customer?.status === "sms_sent" ? (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )} Status
                </h3>
                <Badge
                  variant={
                    customer?.status === "completed"
                      ? "default"
                      : customer?.status === "pending" ||
                        customer?.status === "sms_sent"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-base px-4 py-1 rounded-full tracking-wide"
                >
                  {customer?.status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </TabsContent>
  );
};

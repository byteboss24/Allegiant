"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Phone, Smartphone, MapPin, Calendar, DollarSign, Landmark, ClipboardList, CheckCircle2, Clock, XCircle, Send, PhoneCall, User as UserIcon } from "lucide-react"
import { toast } from "react-toastify"
import { fetchCustomerDetails as fetchCustomerDetailsApi } from "@/lib/apis"
import type { Invoice as CustomerDetails } from "@/lib/props"

export function CustomerDetails() {
  const { invoice_number } = useParams()

  console.log("invoice_number", invoice_number)
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await fetchCustomerDetailsApi(invoice_number as string)
        setCustomer(data)
      } catch (error) {
        console.error('Error fetching customer details:', error)
        toast.error("Failed to load customer details. Please try again later." )
      } finally {
        setIsLoading(false)
      }
    }

    if (invoice_number) {
      fetchDetails()
    }
  }, [invoice_number])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Customer not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <Card className="shadow-2xl rounded-2xl border-0">
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Customer Details
          </CardTitle>
          <CardDescription className="text-base text-gray-500">View and manage customer information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4" /> Name
                </h3>
                <p className="text-xl font-semibold text-gray-800">{`${customer.first_name} ${customer.last_name}`}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4" /> Contact Information
                </h3>
                <div className="space-y-1 text-gray-700">
                  <p className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-400" /> Mobile: {customer.mobile_number}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> Phone: {customer.phone_number}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Email: {customer.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" /> Address
                </h3>
                <p className="text-gray-700">Postcode: {customer.mailing_postcode}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4" /> Invoice Information
                </h3>
                <div className="space-y-1 text-gray-700">
                  <p className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Invoice Number: <span className="font-medium">{customer.invoice_number}</span></p>
                  <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Invoice Date: {customer.invoice_date}</p>
                  <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /> Amount: <span className="font-medium">{customer.invoice_amount}</span></p>
                  <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-500" /> Outstanding: <span className="font-semibold text-yellow-600">{customer.outstanding_amount}</span></p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                  <Landmark className="w-4 h-4" /> FSP Information
                </h3>
                <div className="space-y-1 text-gray-700">
                  <p className="flex items-center gap-2"><Landmark className="w-4 h-4 text-gray-400" /> FSP Name: {customer.fsp_name}</p>
                  <p className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Claim Reference: {customer.claim_reference}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
                    {customer.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : customer.status === "pending" ? <Clock className="w-4 h-4 text-yellow-500" /> : <XCircle className="w-4 h-4 text-red-500" />} Status
                  </h3>
                  <Badge
                    variant={
                      customer.status === "completed"
                        ? "default"
                        : customer.status === "pending"
                          ? "outline"
                          : "destructive"
                    }
                    className="text-base px-4 py-1 rounded-full tracking-wide"
                  >
                    {customer.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200 mt-2">
            {customer.payment_link && (
              <Button asChild size="lg" className="gap-2 shadow-md">
                <a href={customer.payment_link} target="_blank" rel="noopener noreferrer">
                  <DollarSign className="w-4 h-4" /> Make Payment
                </a>
              </Button>
            )}
            <Button variant="outline" size="lg" className="gap-2 shadow-md">
              <Send className="w-4 h-4" /> Send Reminder
            </Button>
            <Button variant="outline" size="lg" className="gap-2 shadow-md">
              <PhoneCall className="w-4 h-4" /> Schedule Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
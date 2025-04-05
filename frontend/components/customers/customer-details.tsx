"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CustomerDetails {
  first_name: string
  last_name: string
  mobile_number: string
  phone_number: string
  claim_reference: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  fsp_name: string
  outstanding_amount: string
  email: string
  mailing_postcode: string
  payment_link: string
  created_at: string
  call_status: string
  campaign_name: string
  script: string
  phone_strategy: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://194.37.82.18:5000'

export function CustomerDetails() {
  const { invoice_number } = useParams()

  console.log("invoice_number", invoice_number)
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${invoice_number}`)
        if (!response.ok) {
          throw new Error('Failed to fetch customer details')
        }
        const data = await response.json()
        setCustomer(data)
      } catch (error) {
        console.error('Error fetching customer details:', error)
        toast({
          title: "Error",
          description: "Failed to load customer details. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (invoice_number) {
      fetchCustomerDetails()
    }
  }, [invoice_number, toast])

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
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>View and manage customer information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p className="text-lg">{`${customer.first_name} ${customer.last_name}`}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                <p>Mobile: {customer.mobile_number}</p>
                <p>Phone: {customer.phone_number}</p>
                <p>Email: {customer.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p>Postcode: {customer.mailing_postcode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Invoice Information</h3>
                <p>Invoice Number: {customer.invoice_number}</p>
                <p>Invoice Date: {customer.invoice_date}</p>
                <p>Amount: {customer.invoice_amount}</p>
                <p>Outstanding Amount: {customer.outstanding_amount}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">FSP Information</h3>
                <p>FSP Name: {customer.fsp_name}</p>
                <p>Claim Reference: {customer.claim_reference}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge
                  variant={
                    customer.call_status === "completed"
                      ? "default"
                      : customer.call_status === "pending"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {customer.call_status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {customer.payment_link && (
              <Button asChild>
                <a href={customer.payment_link} target="_blank" rel="noopener noreferrer">
                  Make Payment
                </a>
              </Button>
            )}
            <Button variant="outline">Send Reminder</Button>
            <Button variant="outline">Schedule Call</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
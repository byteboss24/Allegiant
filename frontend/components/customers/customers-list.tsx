"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, Download, Search, ChevronDown, Filter, MoreHorizontal, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from "next/navigation"


interface Invoice {
  id: string,
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
  status: string
  campaign_name: string
  script: string
  phone_strategy: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch invoices from backend
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/invoices`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Failed to fetch invoices')
        }
        const data = await response.json()
        setInvoices(data)
      } catch (error) {
        console.error('Error fetching invoices:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load invoices. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [toast])

  // Handle CSV upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaign_name', 'Default Campaign')
    formData.append('script', 'default')
    formData.append('phone_strategy', 'random')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/invoices/upload-csv`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Upload failed')
      }

      toast({
        title: "Upload successful",
        description: `Processed ${data.total_records} records. ${data.successful_records} successful, ${data.failed_records} failed.`,
      })

      // Refresh the invoices list
      const invoicesResponse = await fetch(`${API_BASE_URL}/api/v1/invoices`)
      if (invoicesResponse.ok) {
        const newInvoices = await invoicesResponse.json()
        setInvoices(newInvoices)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      event.target.value = ''
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/invoices/export/csv`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Export failed')
      }

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1].replace(/"/g, '') : 
        'invoices.csv'
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: "Your invoice data has been exported successfully.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatusUpdate = async (invoiceNumber: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/invoices/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invoice_number: invoiceNumber,
          status: status 
        }),
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update status')
      }
  
      // Update the local state to reflect the change
      setInvoices(invoices.map(invoice => 
        invoice.invoice_number === invoiceNumber 
          ? { ...invoice, status } 
          : invoice
      ))
  
      toast({
        title: "Status updated",
        description: "Invoice has been marked as completed",
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Filter invoices based on search term and status
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      `${invoice.first_name} ${invoice.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.mobile_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.fsp_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && invoice.status === statusFilter
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Customers</CardTitle>
            <CardDescription>Manage customer invoices and payment status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleUpload}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => document.getElementById('csv-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload CSV</span>
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all" onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1 h-9">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice Amount</TableHead>
                  <TableHead>FSP Name</TableHead>
                  <TableHead>Outstanding Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody key={uuidv4()}>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices?.map((invoice) => (
                    <TableRow key={uuidv4()}>
                      <TableCell className="font-medium">{`${invoice.first_name} ${invoice.last_name}`}</TableCell>
                      <TableCell>{invoice.mobile_number}</TableCell>
                      <TableCell>{invoice.phone_number}</TableCell>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.invoice_date}</TableCell>
                      <TableCell>{invoice.invoice_amount}</TableCell>
                      <TableCell>{invoice.fsp_name}</TableCell>
                      <TableCell>{invoice.outstanding_amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "completed"
                              ? "default"
                              : invoice.status === "pending"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {invoice.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View Details"
                            onClick={() => router.push(`/invoices/${invoice.invoice_number}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.invoice_number}`)}>View details</DropdownMenuItem>
                              <DropdownMenuItem>Send reminder</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(invoice.invoice_number, 'completed')}
                                disabled={invoice.status === 'completed'}
                              >
                                {invoice.status === 'completed' ? 'Already completed' : 'Mark as completed'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>Schedule call</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredInvoices?.length}</strong> of <strong>{invoices.length}</strong> customers
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

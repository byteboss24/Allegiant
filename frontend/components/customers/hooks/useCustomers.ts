import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { Invoice, ApiError } from "@/lib/props"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// API service functions
const invoiceService = {
  async fetchInvoices() {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices`)
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to fetch invoices')
    }
    return response.json()
  },

  async uploadCsv(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/upload-csv`, {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Upload failed')
    }
    return data
  },

  async updateStatus(invoiceNumber: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: invoiceNumber, status }),
    })
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to update status')
    }
    return response.json()
  },

  async deleteInvoices(invoiceNumbers: string[]) {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_numbers: invoiceNumbers }),
    })
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete invoices')
    }
    return response.json()
  },

  async exportCsv() {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/export/csv`)
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Export failed')
    }
    return response
  }
}

export const useCustomers = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoiceService.fetchInvoices()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load invoices",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Handle file upload
  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

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
      const data = await invoiceService.uploadCsv(formData)
      toast({
        title: "Upload successful",
        description: `Processed ${data.total_records} records. ${data.successful_records} successful, ${data.failed_records} failed.`,
      })
      await fetchInvoices()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }, [toast, fetchInvoices])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await invoiceService.exportCsv()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1].replace(/"/g, '') : 
        'invoices.csv'
      
      const blob = await response.blob()
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
  }, [toast])

  // Handle status update
  const handleStatusUpdate = useCallback(async (invoiceNumber: string, status: string) => {
    try {
      await invoiceService.updateStatus(invoiceNumber, status)
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.invoice_number === invoiceNumber 
            ? { ...invoice, status } 
            : invoice
        )
      )
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
    }
  }, [toast])

  // Handle invoice selection
  const handleSelectInvoice = useCallback((invoiceNumber: string) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceNumber)) {
        return prev.filter(id => id !== invoiceNumber)
      }
      return [...prev, invoiceNumber]
    })
  }, [])

  // Handle select all invoices
  const handleSelectAll = useCallback(() => {
    setSelectedInvoices(prev => 
      prev.length === filteredInvoices.length ? [] : filteredInvoices.map(invoice => invoice.invoice_number)
    )
  }, [])

  // Handle delete invoices
  const handleDeleteInvoices = useCallback(async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to delete",
        variant: "destructive",
      })
      return
    }
    
    setIsDeleting(true)
    try {
      await invoiceService.deleteInvoices(selectedInvoices)
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => !selectedInvoices.includes(invoice.invoice_number))
      )
      setSelectedInvoices([])
      toast({
        title: "Invoices deleted",
        description: `Successfully deleted ${selectedInvoices.length} invoice(s)`,
      })
    } catch (error) {
      console.error('Error deleting invoices:', error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete invoices",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setInvoiceToDelete(null)
    }
  }, [selectedInvoices, toast])

  // Handle single invoice delete
  const handleSingleInvoiceDelete = useCallback((invoiceNumber: string) => {
    setInvoiceToDelete(invoiceNumber)
    setSelectedInvoices([invoiceNumber])
    setShowDeleteConfirm(true)
  }, [])

  // Memoize filtered invoices
  const filteredInvoices = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase()
    return invoices.filter((invoice) => {
      const matchesSearch =
        `${invoice.first_name} ${invoice.last_name}`.toLowerCase().includes(searchTermLower) ||
        invoice.mobile_number.toLowerCase().includes(searchTermLower) ||
        invoice.phone_number.toLowerCase().includes(searchTermLower) ||
        invoice.invoice_number.toLowerCase().includes(searchTermLower) ||
        invoice.fsp_name.toLowerCase().includes(searchTermLower)

      if (statusFilter === "all") return matchesSearch
      return matchesSearch && invoice.status === statusFilter
    })
  }, [invoices, searchTerm, statusFilter])

  // Memoize navigation callback
  const navigateToInvoice = useCallback((invoiceNumber: string) => {
    router.push(`/invoices/${invoiceNumber}`)
  }, [router])

  return {
    searchTerm,
    statusFilter,
    invoices: filteredInvoices,
    totalInvoices: invoices.length,
    isLoading,
    isUploading,
    isExporting,
    selectedInvoices,
    isDeleting,
    showDeleteConfirm,
    invoiceToDelete,
    setSearchTerm,
    setStatusFilter,
    setShowDeleteConfirm,
    handleUpload,
    handleExport,
    handleStatusUpdate,
    handleSelectInvoice,
    handleSelectAll,
    handleDeleteInvoices,
    handleSingleInvoiceDelete,
    navigateToInvoice,
  }
} 
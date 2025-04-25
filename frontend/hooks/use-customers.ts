import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import type { Invoice } from "@/lib/props"
import { fetchInvoices, uploadCsv, updateInvoiceStatus, deleteInvoices, exportInvoicesCsv } from "@/lib/apis"

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
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [invoiceToComplete, setInvoiceToComplete] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const router = useRouter()

  // Fetch invoices with pagination and search
  const fetchInvoicesCallback = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchInvoices(page, pageSize, searchTerm)
      setInvoices(data.items)
      setTotalInvoices(data.total)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error("Failed to load invoices. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [toast, page, pageSize, searchTerm])

  useEffect(() => {
    fetchInvoicesCallback()
  }, [fetchInvoicesCallback])

  // Handle file upload
  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file" )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large" )
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaign_name', 'Default Campaign')
    formData.append('script', 'default')
    formData.append('phone_strategy', 'random')

    try {
      const data = await uploadCsv(formData)
      toast.success(`Processed ${data.total_records} records. ${data.successful_records} successful, ${data.failed_records} failed.` )
      await fetchInvoicesCallback()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Upload failed" )
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }, [toast, fetchInvoicesCallback])
  
    // Memoize navigation callback
    const navigateToInvoice = useCallback((invoiceNumber: string) => {
      router.push(`/invoices/${invoiceNumber}`)
    }, [router])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await exportInvoicesCsv()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1].replace(/"/g, '') : 
        'invoices.csv'
      const blob = await response.blob()

      // Try File System Access API
      if ((window as any).showSaveFilePicker) {
        try {
          const opts = {
            suggestedName: filename,
            types: [
              {
                description: 'CSV file',
                accept: {'text/csv': ['.csv']},
              },
            ],
          }
          const handle = await (window as any).showSaveFilePicker(opts)
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          toast.success('Your invoice data has been exported successfully.')
          setIsExporting(false)
          return
        } catch (e) {
          // If user cancels or error, fallback to default
        }
      }

      // Fallback: download as before
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Your invoice data has been exported successfully.')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [toast])

  // Handle status update
  const handleStatusUpdate = useCallback(async (invoiceNumber: string, status: string) => {
    try {
      await updateInvoiceStatus(invoiceNumber, status)
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.invoice_number === invoiceNumber 
            ? { ...invoice, status } 
            : invoice
        )
      )
      toast.success("Invoice has been marked as completed" )
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Update failed" )
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
    setSelectedInvoices(prev => {
      const allSelected = prev.length === invoices.length;
      return allSelected ? [] : invoices.map(invoice => invoice.invoice_number);
    });
  }, [invoices]);

  // Handle delete invoices
  const handleDeleteInvoices = useCallback(async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice to delete" )
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteInvoices(selectedInvoices)
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => !selectedInvoices.includes(invoice.invoice_number))
      )
      setSelectedInvoices([])
      toast.success(`Successfully deleted ${selectedInvoices.length} invoice(s)` )
    } catch (error) {
      console.error('Error deleting invoices:', error)
      toast.error("Delete failed" )
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [selectedInvoices, toast])

  // Handle single invoice delete
  const handleSingleInvoiceDelete = useCallback((invoiceNumber: string) => {
    setSelectedInvoices([invoiceNumber])
    setShowDeleteConfirm(true)
  }, [])

  // Open confirm dialog for marking as completed
  const requestMarkCompleted = useCallback((invoiceNumber: string) => {
    setInvoiceToComplete(invoiceNumber);
    setShowCompleteConfirm(true);
  }, []);

  // Confirm mark as completed
  const confirmMarkCompleted = useCallback(async () => {
    if (!invoiceToComplete) return;
    await handleStatusUpdate(invoiceToComplete, 'completed2');
    setShowCompleteConfirm(false);
    setInvoiceToComplete(null);
  }, [invoiceToComplete, handleStatusUpdate]);

  return {
    filters: {
      searchTerm,
      statusFilter,
      setSearchTerm,
      setStatusFilter,
    },
    selection: {
      selectedInvoices,
      handleSelectInvoice,
      handleSelectAll,
    },
    dialogs: {
      showDeleteConfirm,
      setShowDeleteConfirm,
      showCompleteConfirm,
      setShowCompleteConfirm,
    },
    actions: {
      handleUpload,
      handleExport,
      handleStatusUpdate,
      requestMarkCompleted,
      confirmMarkCompleted,
      handleDeleteInvoices,
      handleSingleInvoiceDelete,
      navigateToInvoice,
    },
    data: {
      invoices,
      totalInvoices,
      isLoading,
      isUploading,
      isExporting,
      isDeleting,
      invoiceToComplete,
      page,
      setPage,
      pageSize,
      setPageSize,
    },
  }
} 
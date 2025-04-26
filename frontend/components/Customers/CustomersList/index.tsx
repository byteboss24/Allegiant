"use client"

import { CustomersToolbar } from "../CustomersToolbar"
import CustomersTable from "../CustomersTable"
import { DeleteDialog } from "../DeleteDialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import React, { useState, useEffect } from "react"
import { useAtom } from "jotai"
import { invoiceTableAllColumns, invoiceTableSelectedColumnsAtom } from "@/lib/atom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { fetchInvoices, uploadCsv, updateInvoiceStatus, deleteInvoices, exportInvoicesCsv } from "@/lib/apis"

export function CustomersList() {
  // State from useCustomers
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [invoiceToComplete, setInvoiceToComplete] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const router = useRouter()

  // Fetch invoices with pagination and search
  async function fetchInvoicesCallback() {
    setIsLoading(true)
    try {
      const data = await fetchInvoices(page, pageSize, searchTerm, statusFilter)
      setInvoices(data.items)
      setTotalInvoices(data.total)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error("Failed to load invoices. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoicesCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm, statusFilter])

  // Handle file upload
  async function handleUpload(event) {
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
  }

  function navigateToInvoice(invoiceNumber) {
    router.push(`/invoices/${invoiceNumber}`)
  }

  // Handle export
  async function handleExport() {
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
  }

  // Handle status update
  async function handleStatusUpdate(invoiceNumber, status) {
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
  }

  // Handle invoice selection
  function handleSelectInvoice(invoiceNumber) {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceNumber)) {
        return prev.filter(id => id !== invoiceNumber)
      }
      return [...prev, invoiceNumber]
    })
  }

  // Handle select all invoices
  function handleSelectAll() {
    setSelectedInvoices(prev => {
      const allSelected = prev.length === invoices.length;
      return allSelected ? [] : invoices.map(invoice => invoice.invoice_number);
    });
  }

  // Handle delete invoices
  async function handleDeleteInvoices() {
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
  }

  // Handle single invoice delete
  function handleSingleInvoiceDelete(invoiceNumber) {
    setSelectedInvoices([invoiceNumber])
    setShowDeleteConfirm(true)
  }

  // Open confirm dialog for marking as completed
  function requestMarkCompleted(invoiceNumber) {
    setInvoiceToComplete(invoiceNumber);
    setShowCompleteConfirm(true);
  }

  // Confirm mark as completed
  async function confirmMarkCompleted() {
    if (!invoiceToComplete) return;
    await handleStatusUpdate(invoiceToComplete, 'completed2');
    setShowCompleteConfirm(false);
    setInvoiceToComplete(null);
  }

  const [selectedColumns, setSelectedColumns] = useAtom(invoiceTableSelectedColumnsAtom);
  const allColumns = invoiceTableAllColumns;
  const handleSelectColumn = (columnKey) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const totalPages = Math.ceil(totalInvoices / pageSize);

  return (
    <div className="space-y-4">
      <DeleteDialog
        open={showDeleteConfirm}
        selectedCount={selectedInvoices.length}
        isDeleting={isDeleting}
        onOpenChange={setShowDeleteConfirm}
        onDelete={handleDeleteInvoices}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <CustomersToolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        selectedCount={selectedInvoices.length}
        isDeleting={isDeleting}
        isUploading={isUploading}
        isExporting={isExporting}
        onSearchChange={e => setSearchTerm(e.target.value)}
        onStatusFilterChange={setStatusFilter}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        onUpload={handleUpload}
        onExport={handleExport}
        allColumns={allColumns}
        selectedColumns={selectedColumns}
        onSelectColumn={handleSelectColumn}
      />

      <CustomersTable
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        isLoading={isLoading}
        onMarkCompleted={requestMarkCompleted}
        onSelectInvoice={handleSelectInvoice}
        onSelectAll={handleSelectAll}
        onView={navigateToInvoice}
        onDelete={handleSingleInvoiceDelete}
        selectedColumns={selectedColumns}
        onSelectColumn={handleSelectColumn}
      />

      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
          </AlertDialogHeader>
          <p>Are you sure you want to mark this invoice as completed?</p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCompleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkCompleted} className="bg-green-600 hover:bg-green-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{invoices?.length}</strong> of <strong>{totalInvoices}</strong> customers
          {selectedInvoices.length > 0 && (
            <span className="ml-2">
              (<strong>{selectedInvoices.length}</strong> selected)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2">
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0 || isLoading}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

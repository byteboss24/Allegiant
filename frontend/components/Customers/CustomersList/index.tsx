"use client"

import Toolbar from "./Toolbar"
import CustomersTable from "../CustomersTable"
import { DeleteDialog } from "../DeleteDialog"
import CompleteDialog from "./CompleteDialog";
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useAtom } from "jotai"
import { invoiceTableAllColumns, invoiceTableSelectedColumnsAtom } from "@/lib/atom"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { fetchInvoices, uploadCsv, updateInvoiceStatus, deleteInvoices, exportInvoicesCsv } from "@/lib/apis"
import Pagination from "./Pagination";

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

  // Memoized fetch callback
  const fetchInvoicesCallback = useCallback(async () => {
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
  }, [page, pageSize, searchTerm, statusFilter])

  useEffect(() => {
    fetchInvoicesCallback()
  }, [fetchInvoicesCallback])

  // Memoized handlers
  const handleUpload = useCallback(async (event) => {
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
  }, [fetchInvoicesCallback])

  const navigateToInvoice = useCallback((invoiceNumber) => {
    router.push(`/invoices/${invoiceNumber}`)
  }, [router])

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
  }, [])

  const handleStatusUpdate = useCallback(async (invoiceNumber, status) => {
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
  }, [])

  const handleSelectInvoice = useCallback((invoiceNumber) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceNumber)) {
        return prev.filter(id => id !== invoiceNumber)
      }
      return [...prev, invoiceNumber]
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedInvoices(prev => {
      const allSelected = prev.length === invoices.length;
      return allSelected ? [] : invoices.map(invoice => invoice.invoice_number);
    });
  }, [invoices]);

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
  }, [selectedInvoices]);

  const handleSingleInvoiceDelete = useCallback((invoiceNumber) => {
    setSelectedInvoices([invoiceNumber])
    setShowDeleteConfirm(true)
  }, [])

  const requestMarkCompleted = useCallback((invoiceNumber) => {
    setInvoiceToComplete(invoiceNumber);
    setShowCompleteConfirm(true);
  }, []);

  const confirmMarkCompleted = useCallback(async () => {
    if (!invoiceToComplete) return;
    await handleStatusUpdate(invoiceToComplete, 'completed2');
    setShowCompleteConfirm(false);
    setInvoiceToComplete(null);
  }, [invoiceToComplete, handleStatusUpdate]);

  const [selectedColumns, setSelectedColumns] = useAtom(invoiceTableSelectedColumnsAtom);
  const allColumns = invoiceTableAllColumns;
  const handleSelectColumn = useCallback((columnKey) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  }, [setSelectedColumns]);

  // Memoized derived value
  const totalPages = useMemo(() => Math.ceil(totalInvoices / pageSize), [totalInvoices, pageSize]);

  return (
    <div className="space-y-4">
      <DeleteDialog
        open={showDeleteConfirm}
        selectedCount={selectedInvoices.length}
        isDeleting={isDeleting}
        onOpenChange={setShowDeleteConfirm}
        onDelete={handleDeleteInvoices}
        onCancel={useCallback(() => setShowDeleteConfirm(false), [])}
      />

      <Toolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        selectedCount={selectedInvoices.length}
        isDeleting={isDeleting}
        isUploading={isUploading}
        isExporting={isExporting}
        onSearchChange={useCallback(e => setSearchTerm(e.target.value), [])}
        onStatusFilterChange={setStatusFilter}
        onDeleteClick={useCallback(() => setShowDeleteConfirm(true), [])}
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

      <CompleteDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        onConfirm={confirmMarkCompleted}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        invoicesLength={invoices.length}
        totalInvoices={totalInvoices}
        selectedInvoicesLength={selectedInvoices.length}
        setPage={setPage}
        isLoading={isLoading}
      />
    </div>
  )
}

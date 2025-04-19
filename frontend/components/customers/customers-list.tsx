"use client"

import { Button } from "@/components/ui/button"
import { CustomersToolbar } from "./CustomersToolbar"
import CustomersTable from "./CustomersTable"
import { DeleteDialog } from "./DeleteDialog"
import { useCustomers } from "./hooks/useCustomers"

export function CustomersList() {
  const {
    searchTerm,
    statusFilter,
    invoices,
    totalInvoices,
    isLoading,
    isUploading,
    isExporting,
    selectedInvoices,
    isDeleting,
    showDeleteConfirm,
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
  } = useCustomers()

  return (
    <div className="space-y-4">
      <DeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        selectedCount={selectedInvoices.length}
        onDelete={handleDeleteInvoices}
        isDeleting={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <CustomersToolbar
        searchTerm={searchTerm}
        onSearchChange={e => setSearchTerm(e.target.value)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        selectedCount={selectedInvoices.length}
        isDeleting={isDeleting}
        onUpload={handleUpload}
        isUploading={isUploading}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <CustomersTable
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        isLoading={isLoading}
        onSelectInvoice={handleSelectInvoice}
        onSelectAll={handleSelectAll}
        onView={navigateToInvoice}
        onMarkCompleted={invoiceNumber => handleStatusUpdate(invoiceNumber, 'completed')}
        onDelete={handleSingleInvoiceDelete}
      />

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
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

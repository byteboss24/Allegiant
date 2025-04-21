"use client"

import { CustomersToolbar } from "./customers-toolbar"
import CustomersTable from "./customers-table"
import { DeleteDialog } from "./delete-dialog"
import { Button } from "@/components/ui/button"
import { useCustomers } from "@/hooks/use-customers"

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
      />

      <CustomersTable
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        isLoading={isLoading}
        onMarkCompleted={invoiceNumber => handleStatusUpdate(invoiceNumber, 'completed')}
        onSelectInvoice={handleSelectInvoice}
        onSelectAll={handleSelectAll}
        onView={navigateToInvoice}
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

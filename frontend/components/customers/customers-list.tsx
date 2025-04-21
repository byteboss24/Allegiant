"use client"

import { CustomersToolbar } from "./customers-toolbar"
import CustomersTable from "./customers-table"
import { DeleteDialog } from "./delete-dialog"
import { Button } from "@/components/ui/button"
import { useCustomers } from "@/hooks/use-customers"

export function CustomersList() {
  const {
    filters,
    selection,
    dialogs,
    actions,
    data,
  } = useCustomers()

  return (
    <div className="space-y-4">
      <DeleteDialog
        open={dialogs.showDeleteConfirm}
        selectedCount={selection.selectedInvoices.length}
        isDeleting={data.isDeleting}
        onOpenChange={dialogs.setShowDeleteConfirm}
        onDelete={actions.handleDeleteInvoices}
        onCancel={() => dialogs.setShowDeleteConfirm(false)}
      />

      <CustomersToolbar
        searchTerm={filters.searchTerm}
        statusFilter={filters.statusFilter}
        selectedCount={selection.selectedInvoices.length}
        isDeleting={data.isDeleting}
        isUploading={data.isUploading}
        isExporting={data.isExporting}
        onSearchChange={e => filters.setSearchTerm(e.target.value)}
        onStatusFilterChange={filters.setStatusFilter}
        onDeleteClick={() => dialogs.setShowDeleteConfirm(true)}
        onUpload={actions.handleUpload}
        onExport={actions.handleExport}
      />

      <CustomersTable
        invoices={data.invoices}
        selectedInvoices={selection.selectedInvoices}
        isLoading={data.isLoading}
        onMarkCompleted={invoiceNumber => actions.handleStatusUpdate(invoiceNumber, 'completed')}
        onSelectInvoice={selection.handleSelectInvoice}
        onSelectAll={selection.handleSelectAll}
        onView={actions.navigateToInvoice}
        onDelete={actions.handleSingleInvoiceDelete}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{data.invoices?.length}</strong> of <strong>{data.totalInvoices}</strong> customers
          {selection.selectedInvoices.length > 0 && (
            <span className="ml-2">
              (<strong>{selection.selectedInvoices.length}</strong> selected)
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

"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Trash2 } from "lucide-react"
import { useInvoices } from "@/hooks/useInvoices"
import { InvoicesTable } from "./invoices-table"
import { InvoicePagination } from "./invoice-pagination"
import { InvoiceDeletionDialogs } from "./invoice-deletion-dialogs"

export function InvoiceList() {
  const {
    invoices,
    currentPage,
    totalPages,
    loading,
    error,
    selectedInvoiceIds,
    showDeleteDialog,
    showBulkDeleteDialog,
    setCurrentPage,
    handleDeleteRequest,
    confirmDelete,
    handleBulkDeleteRequest,
    confirmBulkDelete,
    toggleInvoiceSelection,
    toggleAllInvoices,
    setShowDeleteDialog,
    setShowBulkDeleteDialog,
  } = useInvoices();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          {selectedInvoiceIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteRequest}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedInvoiceIds.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">Error: {error}</div>
          ) : invoices.length === 0 ? (
            <div className="text-muted-foreground text-center py-10">No invoices found.</div>
          ) : (
            <>
              <InvoicesTable
                invoices={invoices}
                selectedInvoiceIds={selectedInvoiceIds}
                toggleInvoiceSelection={toggleInvoiceSelection}
                toggleAllInvoices={toggleAllInvoices}
                handleDeleteRequest={handleDeleteRequest}
              />
              <InvoicePagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <InvoiceDeletionDialogs
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        confirmDelete={confirmDelete}
        showBulkDeleteDialog={showBulkDeleteDialog}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        confirmBulkDelete={confirmBulkDelete}
        selectedInvoiceIdsCount={selectedInvoiceIds.length}
      />
    </>
  )
} 
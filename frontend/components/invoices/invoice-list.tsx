import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox as CheckboxComponent } from "@/components/ui/checkbox"

interface Invoice {
  id: string
  invoice_number: string
  created_at: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  pdf_url: string
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDeleteDialog(true)
  }

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedInvoice) return

    try {
      const response = await fetch(`/api/v1/invoice/${selectedInvoice.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      // Remove the deleted invoice from the state
      setInvoices(invoices.filter(i => i.id !== selectedInvoice.id))
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedInvoice(null)
    }
  }

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch(`/api/v1/invoices/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedInvoices }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoices')
      }

      // Remove the deleted invoices from the state
      setInvoices(invoices.filter(i => !selectedInvoices.includes(i.id)))
      setSelectedInvoices([])
      toast({
        title: "Success",
        description: "Invoices deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting invoices:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoices",
        variant: "destructive",
      })
    } finally {
      setShowBulkDeleteDialog(false)
    }
  }

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const toggleAllInvoices = () => {
    setSelectedInvoices(prev => 
      prev.length === invoices.length 
        ? [] 
        : invoices.map(invoice => invoice.id)
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          {selectedInvoices.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedInvoices.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <CheckboxComponent
                        checked={selectedInvoices.length === invoices.length}
                        onCheckedChange={toggleAllInvoices}
                      />
                    </TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <CheckboxComponent
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleString()}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.pdf_url, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between space-x-2 py-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedInvoices.length} selected invoice{selectedInvoices.length === 1 ? '' : 's'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 
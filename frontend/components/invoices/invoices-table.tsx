"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Trash2 } from "lucide-react";

// Reuse the Invoice type definition
interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdf_url: string;
  [key: string]: any; 
}

interface InvoicesTableProps {
  invoices: Invoice[];
  selectedInvoiceIds: string[];
  toggleInvoiceSelection: (invoiceId: string) => void;
  toggleAllInvoices: () => void;
  handleDeleteRequest: (invoice: Invoice) => void;
  // Add other necessary props like handlers for viewing details, etc.
}

export function InvoicesTable({
  invoices,
  selectedInvoiceIds,
  toggleInvoiceSelection,
  toggleAllInvoices,
  handleDeleteRequest,
}: InvoicesTableProps) {

  const allSelected = invoices.length > 0 && selectedInvoiceIds.length === invoices.length;
  const isIndeterminate = selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < invoices.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={allSelected || isIndeterminate}
              aria-label="Select all invoices"
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
              <Checkbox
                checked={selectedInvoiceIds.includes(invoice.id)}
                onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                aria-label={`Select invoice ${invoice.invoice_number}`}
              />
            </TableCell>
            <TableCell>{invoice.invoice_number}</TableCell>
            <TableCell>{new Date(invoice.created_at).toLocaleString()}</TableCell>
            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                  onClick={() => window.open(invoice.pdf_url, '_blank')}
                  title="View PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteRequest(invoice)}
                  title="Delete Invoice"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
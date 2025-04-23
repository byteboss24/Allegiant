import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Check, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { CustomersTableProps } from "@/lib/props";
import { Checkbox } from "@/components/ui/checkbox";


const CustomersTable: React.FC<CustomersTableProps> = ({
  invoices,
  selectedInvoices,
  isLoading,
  onSelectInvoice,
  onSelectAll,
  onView,
  onMarkCompleted,
  onDelete,
}) => (
    <Table>
        <TableHeader>
        <TableRow>
            <TableHead className="w-[30px]">
            <Checkbox
                checked={
                invoices.length === 0
                    ? false
                    : selectedInvoices.length === invoices.length
                    ? true
                    : selectedInvoices.length === 0
                    ? false
                    : "indeterminate"
                }
                onCheckedChange={onSelectAll}
                aria-label="Select all invoices"
            />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Mobile Number</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Invoice Date</TableHead>
            <TableHead>Invoice Amount</TableHead>
            <TableHead>FSP Name</TableHead>
            <TableHead>Outstanding Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
        </TableRow>
        </TableHeader>
        <TableBody key={uuidv4()}>
        {isLoading ? (
            <TableRow>
            <TableCell colSpan={11} className="text-center py-8">
                <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </TableCell>
            </TableRow>
        ) : invoices?.length === 0 ? (
            <TableRow>
            <TableCell colSpan={11} className="text-center py-8">
                No invoices found
            </TableCell>
            </TableRow>
        ) : (
            invoices?.map((invoice) => (
            <TableRow key={uuidv4()}>
                <TableCell>
                <Checkbox
                    checked={selectedInvoices.includes(invoice.invoice_number)}
                    onCheckedChange={() => onSelectInvoice(invoice.invoice_number)}
                    aria-label={`Select invoice ${invoice.invoice_number}`}
                />
                </TableCell>
                <TableCell className="font-medium">{`${invoice.first_name} ${invoice.last_name}`}</TableCell>
                <TableCell>{invoice.mobile_number}</TableCell>
                <TableCell>{invoice.phone_number}</TableCell>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.invoice_date}</TableCell>
                <TableCell>{invoice.invoice_amount}</TableCell>
                <TableCell>{invoice.fsp_name}</TableCell>
                <TableCell>{invoice.outstanding_amount}</TableCell>
                <TableCell className="text-center">
                <Badge
                    variant={
                    invoice.status === "completed"
                        ? "default"
                        : invoice.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                >
                    {invoice.status?.toUpperCase()}
                </Badge>
                </TableCell>
                <TableCell>
                <div className="flex justify-end gap-2">
                    <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center"
                    title="View Details"
                    onClick={() => onView(invoice.invoice_number)}
                    >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                    </button>
                    <button
                      type="button"
                      className="h-8 w-8 flex items-center justify-center text-green-600 disabled:opacity-50"
                      title={invoice.status === 'completed' ? 'Already completed' : 'Mark as completed'}
                      onClick={() => onMarkCompleted(invoice.invoice_number)}
                      disabled={invoice.status === 'completed'}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Mark as completed</span>
                    </button>
                    <button
                      type="button"
                      className="h-8 w-8 flex items-center justify-center text-red-600"
                      title="Delete invoice"
                      onClick={() => onDelete(invoice.invoice_number)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete invoice</span>
                    </button>
                </div>
                </TableCell>
            </TableRow>
            ))
        )}
        </TableBody>
    </Table>
);

export default CustomersTable; 
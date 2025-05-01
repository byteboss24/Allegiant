import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Check, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { CustomersTableProps } from "@/lib/props";
import { Checkbox } from "@/components/ui/checkbox";
import { invoiceTableAllColumns as columnDefs } from "@/lib/atom";

const CustomersTable: React.FC<CustomersTableProps> = ({
  invoices,
  selectedInvoices,
  isLoading,
  onSelectInvoice,
  onSelectAll,
  onView,
  onMarkCompleted,
  onDelete,
  selectedColumns,
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
        {columnDefs
          .filter((col) => selectedColumns.includes(col.key))
          .map((col) => (
            <TableHead
              key={col.key}
              className={
                col.key === "actions"
                  ? "text-right"
                  : col.key === "status"
                  ? "text-center"
                  : "whitespace-nowrap"
              }
            >
              {col.label}
            </TableHead>
          ))}
      </TableRow>
    </TableHeader>
    <TableBody key={uuidv4()}>
      {isLoading ? (
        <TableRow>
          <TableCell
            colSpan={columnDefs.length + 1}
            className="text-center py-8"
          >
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </TableCell>
        </TableRow>
      ) : invoices?.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={columnDefs.length + 1}
            className="text-center py-8"
          >
            No invoices found
          </TableCell>
        </TableRow>
      ) : (
        invoices?.map((invoice) => (
          <TableRow key={invoice.invoice_number}>
            <TableCell>
              <Checkbox
                checked={selectedInvoices.includes(invoice.invoice_number)}
                onCheckedChange={() => onSelectInvoice(invoice.invoice_number)}
                aria-label={`Select invoice ${invoice.invoice_number}`}
              />
            </TableCell>
            {/* Render only selected columns */}
            {columnDefs.map((col) => {
              if (!selectedColumns.includes(col.key)) return null;
              switch (col.key) {
                case "name":
                  return (
                    <TableCell
                      key={col.key}
                      className="font-medium"
                    >{`${invoice.first_name} ${invoice.last_name}`}</TableCell>
                  );
                case "mobile_number":
                  return (
                    <TableCell key={col.key}>{invoice.mobile_number}</TableCell>
                  );
                case "phone_number":
                  return (
                    <TableCell key={col.key}>{invoice.phone_number}</TableCell>
                  );
                case "invoice_number":
                  return (
                    <TableCell key={col.key}>
                      {invoice.invoice_number}
                    </TableCell>
                  );
                case "invoice_date":
                  return (
                    <TableCell key={col.key}>
                      {invoice.invoice_date.split("T")[0]}
                    </TableCell>
                  );
                case "invoice_amount":
                  return (
                    <TableCell key={col.key}>
                      {invoice.invoice_amount}
                    </TableCell>
                  );
                case "fsp_name":
                  return (
                    <TableCell key={col.key}>{invoice.fsp_name}</TableCell>
                  );
                case "outstanding_amount":
                  return (
                    <TableCell key={col.key}>
                      {invoice.outstanding_amount}
                    </TableCell>
                  );
                case "status":
                  return (
                    <TableCell key={col.key} className="text-center">
                      <Badge
                        variant={
                          invoice.status === "voice_message" ||
                          invoice.status === "sms_sent" ||
                          invoice.status === "seek" ||
                          invoice.status === "reserve"
                            ? "secondary"
                            : invoice.status === "completed"
                            ? "default"
                            : invoice.status === "pending"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {invoice.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                  );
                case "actions":
                  return (
                    <TableCell key={col.key} className="text-right">
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
                        {invoice.status !== "completed" && (
                          <button
                            type="button"
                            className="h-8 w-8 flex items-center justify-center text-green-600 disabled:opacity-50"
                            title={
                              invoice.status === "completed"
                                ? "Already completed"
                                : "Mark as completed"
                            }
                            onClick={() =>
                              onMarkCompleted(invoice.invoice_number)
                            }
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as completed</span>
                          </button>
                        )}
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
                  );
                default:
                  return null;
              }
            })}
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default CustomersTable;

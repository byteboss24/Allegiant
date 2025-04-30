import { atom } from "jotai";
import { Agent } from "@/lib/datatypes";

export const invoiceTableAllColumns = [
  { key: "name", label: "Name" },
  { key: "mobile_number", label: "Mobile Number" },
  { key: "phone_number", label: "Phone Number" },
  { key: "invoice_number", label: "Invoice Number" },
  { key: "invoice_date", label: "Invoice Date" },
  { key: "invoice_amount", label: "Invoice Amount" },
  { key: "fsp_name", label: "FSP Name" },
  { key: "outstanding_amount", label: "Outstanding Amount" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export const isActiveAtom = atom(false);
export const agentsAtom = atom<Agent[]>([]);
export const selectedAgentIdAtom = atom<number>(null);
export const selectedAgentAtom = atom<Agent>(null);
export const invoiceTableSelectedColumnsAtom = atom<string[]>(invoiceTableAllColumns.map(c => c.key));

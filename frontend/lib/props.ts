import type React from "react";

export interface CallListProps {
  callRecordings: any[];
  loading: boolean;
  error: string | null;
  selectedIds: string[];
  selectedCall: any;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onMultiDelete: () => void;
  onSelectCall: (call: any) => void;
  onSelectRow: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (call: any) => void;
  setCurrentPage: (page: number) => void;
}

export interface CallPlayerProps {
  selectedCall: any;
  audioLoading: boolean;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export interface CallDialogsProps {
  showDeleteDialog: boolean;
  showMultiDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  setShowMultiDeleteDialog: (open: boolean) => void;
  confirmDelete: () => void;
  confirmMultiDelete: () => void;
} 

export interface Invoice {
  id?: string,
  first_name: string
  last_name: string
  mobile_number: string
  phone_number: string
  claim_reference: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  fsp_name: string
  outstanding_amount: string
  email: string
  mailing_postcode: string
  payment_link: string
  created_at: string
  status: string
  campaign_name: string
  script: string
  phone_strategy: string
}

export interface ApiError {
  detail?: string
  message?: string
}

export interface CustomersTableProps {
  invoices: Invoice[];
  selectedInvoices: string[];
  isLoading: boolean;
  onSelectInvoice: (invoiceNumber: string) => void;
  onSelectAll: () => void;
  onView: (invoiceNumber: string) => void;
  onMarkCompleted: (invoiceNumber: string) => void;
  onDelete: (invoiceNumber: string) => void;
}

export interface CustomersToolbarProps {
  searchTerm: string;
  statusFilter: string;
  selectedCount: number;
  isDeleting: boolean;
  isUploading: boolean;
  isExporting: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusFilterChange: (value: string) => void;
  onDeleteClick: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export interface DeleteDialogProps {
  open: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCancel?: () => void;
}

export interface TableRowActionsProps {
  disableMarkCompleted: boolean;
  onView: () => void;
  onMarkCompleted: () => void;
  onDelete: () => void;
}

export interface Agent {
  id: number
  name: string
  voice: string
  status: string
  system_prompt: string
}

export interface TodayStatus {
  total_calls: number
  completed_calls: number
  other_calls: number
}

export interface CallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId?: number
}

export interface MonthlyStats {
  total_invoices: number
  completed_invoices: number
  completion_rate: number
}

export interface DashboardShellProps {
  children: React.ReactNode
}

export interface WeeklyStats {
  date: string;
  total_calls: number;
  completed_calls: number;
  other_calls: number;
}

export interface RecentCall {
  id: number
  invoice_number: string
  status: string
  duration: number
  created_at: string
  first_name: string
  last_name: string
}
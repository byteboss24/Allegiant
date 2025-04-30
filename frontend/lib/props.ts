import type React from "react"
import type { CallRecordingItem, Invoice, Agent } from "./datatypes"

export interface IconProps {
  id?: string
  className?: string
  width?: string
  height?: string
}

export interface CallListProps {
  callRecordings: CallRecordingItem[]
  loading: boolean
  error: string | null
  selectedIds: string[]
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onMultiDelete: () => void
  onSelectRow: (id: string) => void
  onSelectAll: () => void
  onDelete: (call: CallRecordingItem) => void
  setCurrentPage: (page: number) => void
  onCallSelected?: (call: CallRecordingItem) => void
}

export interface CallPlayerProps {
  selectedCall: CallRecordingItem | null
  audioLoading: boolean
  audioUrl: string | null
}

export interface CallDialogsProps {
  showDeleteDialog: boolean
  showMultiDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  setShowMultiDeleteDialog: (open: boolean) => void
  confirmDelete: () => void
  confirmMultiDelete: () => void
}

export interface CustomersTableProps {
  invoices: Invoice[]
  selectedInvoices: string[]
  isLoading: boolean
  onSelectInvoice: (invoiceId: string) => void
  onSelectAll: () => void
  onView: (invoiceId: string) => void
  onMarkCompleted: (invoiceId: string) => void
  onDelete: (invoiceId: string) => void
  selectedColumns: string[]
  onSelectColumn: (columnKey: string) => void
}

export interface CustomersToolbarProps {
  searchTerm: string
  statusFilter: string
  selectedCount: number
  isDeleting: boolean
  isUploading: boolean
  isExporting: boolean
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStatusFilterChange: (value: string) => void
  onDeleteClick: () => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
}

export interface DeleteDialogProps {
  open: boolean
  selectedCount: number
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  onCancel?: () => void
}

export interface CallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId?: number
}

export interface DashboardShellProps {
  children: React.ReactNode
}

export interface AgentConfigHeaderProps {
  selectedAgentId: number | null
  selectedAgent: Agent | null
  isLoading: boolean
  handleAgentSelect: (agentId: number) => void
  updateAgent: (updatedFields: Partial<Agent>) => Promise<Agent | null>
  handleStatusChange: (newStatus: boolean) => void
  isAgentActive?: boolean
}

export interface AgentSystemPromptProps {
  selectedAgent: Agent | null
  isLoading: boolean
  updateAgent: (updatedFields: Partial<Agent>) => Promise<Agent | null>
  onOpenWordDialog: () => void
  isAgentActive?: boolean
}

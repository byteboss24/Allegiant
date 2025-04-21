import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    // Assuming fetchInvoices exists
    fetchInvoices as apiFetchInvoices, 
    deleteInvoice as apiDeleteInvoice, 
    bulkDeleteInvoices as apiBulkDeleteInvoices 
} from "@/lib/apis";

// Define a type for the Invoice item, adjust properties as needed
interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdf_url: string;
  // Add other relevant properties from your API response
  [key: string]: any; 
}

// Remove specific API response type for now
// interface ApiFetchInvoicesResponse { ... }

export function useInvoices(/* Consider adding pagination params later */) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // Keep for potential future use
  const [totalPages, setTotalPages] = useState(1); // Keep for potential future use
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<Invoice | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { toast } = useToast();

  // Fetch Invoices Logic - Simplified & using any type for now
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        // TODO: Fix API call signature and response typing for apiFetchInvoices
        // Assuming it currently takes no args and returns at least an array
        const data: any = await apiFetchInvoices(); 
        
        // Basic check if data is an array (adjust based on actual response)
        if (Array.isArray(data)) {
             setInvoices(data);
        } else if (data && Array.isArray(data.items)) {
             setInvoices(data.items);
             // TODO: Set totalPages, currentPage based on actual API response fields
             // setTotalPages(Math.ceil(data.total / itemsPerPage) || 1);
        } else {
            console.warn("Unexpected data format from fetchInvoices:", data);
            setInvoices([]);
        }

    } catch (err: any) {
        console.error("Error fetching invoices:", err);
        setError(err.message || "Failed to fetch invoices.");
        setInvoices([]); 
        setTotalPages(1);
        setCurrentPage(1);
    } finally {
        setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove pagination dependencies for now

  // Effect to fetch invoices on initial mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Deletion Logic - Refetch all for now
  const confirmDelete = useCallback(async () => {
    if (!selectedInvoiceForDelete) return;
    const idToDelete = selectedInvoiceForDelete.id;
    try {
      await apiDeleteInvoice(idToDelete);
      toast({ title: "Success", description: "Invoice deleted." });
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({ title: "Error", description: "Failed to delete invoice.", variant: "destructive" });
    } finally {
      setShowDeleteDialog(false);
      setSelectedInvoiceForDelete(null);
    }
  }, [selectedInvoiceForDelete, fetchInvoices, toast]);

  // Bulk Deletion Logic - Refetch all for now
  const confirmBulkDelete = useCallback(async () => {
    if (selectedInvoiceIds.length === 0) return;
    const idsToDelete = [...selectedInvoiceIds];
    try {
      await apiBulkDeleteInvoices(idsToDelete);
      toast({ title: "Success", description: `Deleted ${idsToDelete.length} invoice(s).` });
      setSelectedInvoiceIds([]); 
      fetchInvoices(); // Refetch all data after bulk delete
    } catch (error) {
      console.error('Error deleting multiple invoices:', error);
      toast({ title: "Error", description: "Failed to delete selected invoices.", variant: "destructive" });
    } finally {
      setShowBulkDeleteDialog(false);
    }
  }, [selectedInvoiceIds, fetchInvoices, toast]);

  // Add back the handlers that trigger the dialogs
  const handleDeleteRequest = useCallback((invoice: Invoice) => {
    setSelectedInvoiceForDelete(invoice);
    setShowDeleteDialog(true);
  }, []);

  const handleBulkDeleteRequest = useCallback(() => {
    if (selectedInvoiceIds.length > 0) {
        setShowBulkDeleteDialog(true);
    }
  }, [selectedInvoiceIds.length]);

  // Selection Logic (remains the same)
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  const toggleAllInvoices = useCallback(() => {
    // Ensure invoices is always an array before mapping
    const currentInvoices = Array.isArray(invoices) ? invoices : [];
    setSelectedInvoiceIds(prev => 
      prev.length === currentInvoices.length && currentInvoices.length > 0
        ? [] 
        : currentInvoices.map(invoice => invoice.id)
    );
  }, [invoices]);

  return {
    invoices,
    currentPage,
    totalPages,
    loading,
    error,
    selectedInvoiceIds,
    showDeleteDialog,
    showBulkDeleteDialog,
    setCurrentPage, // Still expose for potential future pagination
    handleDeleteRequest,
    confirmDelete,
    handleBulkDeleteRequest,
    confirmBulkDelete,
    toggleInvoiceSelection,
    toggleAllInvoices,
    setShowDeleteDialog,
    setShowBulkDeleteDialog,
  };
} 
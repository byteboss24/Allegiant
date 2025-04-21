import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    fetchInvoices as apiFetchInvoices, 
    deleteInvoice as apiDeleteInvoice, 
    bulkDeleteInvoices as apiBulkDeleteInvoices 
} from "@/lib/apis";
import type { Invoice } from "@/lib/props"; // Import Invoice type

// Local Invoice definition removed

export function useInvoices(/* Consider adding pagination params later */) {
  const [invoices, setInvoices] = useState<Invoice[]>([]); // Use imported Invoice type
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1); 
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
        const data: any = await apiFetchInvoices(); 
        if (Array.isArray(data)) {
             setInvoices(data as Invoice[]);
        } else if (data && Array.isArray(data.items)) {
             setInvoices(data.items as Invoice[]);
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
  }, []); 

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const confirmDelete = useCallback(async () => {
    if (!selectedInvoiceForDelete) return;
    // Assuming the imported Invoice type has an id field
    const idToDelete = selectedInvoiceForDelete.id!;
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

  const confirmBulkDelete = useCallback(async () => {
    if (selectedInvoiceIds.length === 0) return;
    const idsToDelete = [...selectedInvoiceIds];
    try {
      await apiBulkDeleteInvoices(idsToDelete);
      toast({ title: "Success", description: `Deleted ${idsToDelete.length} invoice(s).` });
      setSelectedInvoiceIds([]); 
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting multiple invoices:', error);
      toast({ title: "Error", description: "Failed to delete selected invoices.", variant: "destructive" });
    } finally {
      setShowBulkDeleteDialog(false);
    }
  }, [selectedInvoiceIds, fetchInvoices, toast]);

  const handleDeleteRequest = useCallback((invoice: Invoice) => { // Use imported Invoice type
    setSelectedInvoiceForDelete(invoice);
    setShowDeleteDialog(true);
  }, []);

  const handleBulkDeleteRequest = useCallback(() => {
    if (selectedInvoiceIds.length > 0) {
        setShowBulkDeleteDialog(true);
    }
  }, [selectedInvoiceIds.length]);

  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  const toggleAllInvoices = useCallback(() => {
    const currentInvoices = Array.isArray(invoices) ? invoices : [];
    // Assuming the imported Invoice type has an id field
    setSelectedInvoiceIds(prev => 
      prev.length === currentInvoices.length && currentInvoices.length > 0
        ? [] 
        : currentInvoices.map(invoice => invoice.id!)
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
    setCurrentPage,
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
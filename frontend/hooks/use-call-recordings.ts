import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchRecords, fetchAudio, deleteRecording, deleteMultipleRecordings } from "@/lib/apis";
import type { CallRecordingItem } from "@/lib/props"; // Import moved type

// Interface CallRecordingItem moved to props.ts
// Interface FetchResponse removed or will be defined in props.ts if needed elsewhere

// Assume API response types are handled correctly now or defined in props.ts
interface FetchRecordsResponse {
  items: CallRecordingItem[];
  total: number;
}

export function useCallRecordings(initialItemsPerPage = 10) {
  // ... (state variables)
  const [callRecordings, setCallRecordings] = useState<CallRecordingItem[]>([]);
  // ... (rest of state variables)

  const { toast } = useToast();

  // Effect for fetching records based on pagination
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRecords(currentPage, itemsPerPage)
      .then((data: FetchRecordsResponse) => { // Use defined response type
        setTotalItems(data.total);
        setCallRecordings(data.items);
        setLoading(false);
      })
      // ... (catch block)
  }, [currentPage, itemsPerPage]);

  // ... (rest of the hook: cleanup, handleSelectCall, deletion logic, selection logic) ...
  
  const handleSelectCall = useCallback(async (call: CallRecordingItem) => {
      //... function body
  }, [selectedCall, audioUrl, toast]);

  const handleDeleteRequest = useCallback((recording: CallRecordingItem) => {
     //... function body
  }, []);

  // ... (confirmDelete, handleSelectRow, handleSelectAll, handleMultiDeleteRequest, confirmMultiDelete)
  
  return {
    // ... returned values
  };
} 
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchRecords, fetchAudio, deleteRecording, deleteMultipleRecordings } from "@/lib/apis";
import { CallRecordingItem } from "@/lib/props";

// Define a type for the call recording item, adjust properties as needed
interface FetchResponse {
  items: CallRecordingItem[];
  total: number;
}

export function useCallRecordings(initialItemsPerPage = 10) {
  const [callRecordings, setCallRecordings] = useState<CallRecordingItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] = useState<CallRecordingItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [selectedRecordingForDelete, setSelectedRecordingForDelete] = useState<CallRecordingItem | null>(null);
  const [selectedIdsForMultiDelete, setSelectedIdsForMultiDelete] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);

  const { toast } = useToast();

  // Effect for fetching records based on pagination
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRecords(currentPage, itemsPerPage)
      .then((data: FetchResponse) => {
        setTotalItems(data.total);
        setCallRecordings(data.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recordings:", err);
        setError(err.message || "Failed to fetch recordings.");
        setLoading(false);
      });
  }, [currentPage, itemsPerPage]);

  // Cleanup blob URL on unmount or when audioUrl changes
  useEffect(() => {
    const currentAudioUrl = audioUrl;
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [audioUrl]);

  const handleSelectCall = useCallback(async (call: CallRecordingItem) => {
    if (selectedCall?.id === call.id) {
      if (audioRef.current) audioRef.current.play();
      return;
    }

    setSelectedCall(call);
    setAudioLoading(true);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const blob = await fetchAudio(call.audio_url);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioLoading(false);
      // Wait a tick for the audio element to potentially update its src
      setTimeout(() => {
          if (audioRef.current) {
              audioRef.current.load();
              audioRef.current.play().catch(e => console.error("Error playing audio:", e));
          }
      }, 0);
    } catch (error: any) {
      setAudioLoading(false);
      console.error('Error fetching/playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to load or play audio recording.",
        variant: "destructive",
      });
    }
  }, [selectedCall, audioUrl, toast]);

  const handleDeleteRequest = useCallback((recording: CallRecordingItem) => {
    setSelectedRecordingForDelete(recording);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedRecordingForDelete) return;
    const idToDelete = selectedRecordingForDelete.id;
    try {
      await deleteRecording(idToDelete);
      setCallRecordings((prev) => prev.filter((recording) => recording.id !== idToDelete));
      setTotalItems(prev => prev - 1);
      setShowDeleteDialog(false);
      setSelectedRecordingForDelete(null);
      toast({
        title: "Success",
        description: "Call recording deleted.",
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: "Error",
        description: "Failed to delete call recording.",
        variant: "destructive",
      });
      // Optionally keep dialog open on error?
      // setShowDeleteDialog(false);
      // setSelectedRecordingForDelete(null);
    }
  }, [selectedRecordingForDelete, toast]);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIdsForMultiDelete((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIdsForMultiDelete.length === callRecordings.length) {
      setSelectedIdsForMultiDelete([]);
    } else {
      setSelectedIdsForMultiDelete(callRecordings.map((call) => call.id));
    }
  }, [callRecordings, selectedIdsForMultiDelete.length]);

  const handleMultiDeleteRequest = useCallback(() => {
    if (selectedIdsForMultiDelete.length > 0) {
        setShowMultiDeleteDialog(true);
    }
  }, [selectedIdsForMultiDelete.length]);

  const confirmMultiDelete = useCallback(async () => {
    if (selectedIdsForMultiDelete.length === 0) return;
    const idsToDelete = [...selectedIdsForMultiDelete];
    try {
      await deleteMultipleRecordings(idsToDelete);
      setCallRecordings((prev) => prev.filter((rec) => !idsToDelete.includes(rec.id)));
      // Also adjust totalItems if needed, or refetch current page
      setTotalItems(prev => prev - idsToDelete.length);
      setSelectedIdsForMultiDelete([]);
      setShowMultiDeleteDialog(false);
      toast({
        title: "Success",
        description: `Deleted ${idsToDelete.length} call(s).`,
      });
    } catch (error) {
      console.error('Error deleting multiple recordings:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected calls.",
        variant: "destructive",
      });
    }
  }, [selectedIdsForMultiDelete, toast]);

  return {
    callRecordings,
    currentPage,
    itemsPerPage,
    totalItems,
    loading,
    error,
    selectedCall,
    audioUrl,
    audioLoading,
    audioRef,
    selectedIds: selectedIdsForMultiDelete,
    showDeleteDialog,
    showMultiDeleteDialog,
    setCurrentPage,
    handleSelectCall,
    handleDeleteRequest,
    confirmDelete,
    handleSelectRow,
    handleSelectAll,
    handleMultiDeleteRequest,
    confirmMultiDelete,
    setShowDeleteDialog,
    setShowMultiDeleteDialog,
  };
} 
"use client";

import CallList from "@/components/Calls/CallList";
import CallPlayer from "@/components/Calls/CallPlayer";
import CallDialogs from "@/components/Calls/CallDialogs";
import CallRecordingsToolbar from "@/components/Calls/CallRecordingsToolbar";
import CallRecordingsHeader from "../../components/Calls/Header";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchRecords, deleteRecording, deleteMultipleRecordings } from "@/lib/apis";
import { Separator } from "@/components/ui/separator";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CallRecordingsPage() {
  const [callRecordings, setCallRecordings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRecordingForDelete, setSelectedRecordingForDelete] = useState(null);
  const [selectedIdsForMultiDelete, setSelectedIdsForMultiDelete] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRecords(currentPage, itemsPerPage, debouncedSearchTerm, statusFilter)
      .then((data) => {
        setTotalItems(data.total);
        setCallRecordings(data.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recordings:", err);
        setError(err.message || "Failed to fetch recordings.");
        setLoading(false);
      });
  }, [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter]);

  function handleDeleteRequest(recording) {
    setSelectedRecordingForDelete(recording);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!selectedRecordingForDelete) return;
    const idToDelete = selectedRecordingForDelete.id;
    try {
      await deleteRecording(idToDelete);
      setCallRecordings((prev) => prev.filter((recording) => recording.id !== idToDelete));
      setTotalItems(prev => prev - 1);
      setShowDeleteDialog(false);
      setSelectedRecordingForDelete(null);
      toast.success("Call recording deleted.");
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error("Failed to delete call recording.");
    }
  }

  function handleSelectRow(id) {
    setSelectedIdsForMultiDelete((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    if (selectedIdsForMultiDelete.length === callRecordings.length) {
      setSelectedIdsForMultiDelete([]);
    } else {
      setSelectedIdsForMultiDelete(callRecordings.map((call) => call.id));
    }
  }

  function handleMultiDeleteRequest() {
    if (selectedIdsForMultiDelete.length > 0) {
      setShowMultiDeleteDialog(true);
    }
  }

  async function confirmMultiDelete() {
    if (selectedIdsForMultiDelete.length === 0) return;
    const idsToDelete = [...selectedIdsForMultiDelete];
    try {
      await deleteMultipleRecordings(idsToDelete);
      setCallRecordings((prev) => prev.filter((rec) => !idsToDelete.includes(rec.id)));
      setTotalItems(prev => prev - idsToDelete.length);
      setSelectedIdsForMultiDelete([]);
      setShowMultiDeleteDialog(false);
      toast.success(`Deleted ${idsToDelete.length} call(s).`);
    } catch (error) {
      console.error('Error deleting multiple recordings:', error);
      toast.error("Failed to delete selected calls.");
    }
  }

  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-background dark:via-background dark:to-blue-950 -z-10" />
      <div className="relative w-full flex items-start justify-center">
        <div className="shadow-xl w-full rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-background/80 backdrop-blur">
          <CallRecordingsHeader />
          <Separator className="my-2" />
          <div className="px-6 pt-2 justify-end flex">
            <CallRecordingsToolbar
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onFilterChange={setStatusFilter}
            />
          </div>
          <div className="flex-1 p-0 sm:p-6 h-full min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
              <div
                id="call-recordings-table"
                className="md:col-span-2 h-full min-h-0 rounded-xl bg-white/70 shadow-inner border border-gray-100"
              >
                <CallList
                  callRecordings={callRecordings}
                  loading={loading}
                  error={error}
                  selectedIds={selectedIdsForMultiDelete}
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                  onDelete={handleDeleteRequest}
                  onMultiDelete={handleMultiDeleteRequest}
                  setCurrentPage={setCurrentPage}
                  onCallSelected={setSelectedCall}
                />
              </div>
              <div className="md:col-span-1 h-full flex flex-col min-h-0">
                <CallPlayer selectedCall={selectedCall}/>
              </div>
            </div>
            <CallDialogs
              showDeleteDialog={showDeleteDialog}
              showMultiDeleteDialog={showMultiDeleteDialog}
              setShowDeleteDialog={setShowDeleteDialog}
              setShowMultiDeleteDialog={setShowMultiDeleteDialog}
              confirmDelete={confirmDelete}
              confirmMultiDelete={confirmMultiDelete}
            />
          </div>
        </div>
      </div>
    </>
  );
}

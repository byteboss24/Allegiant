"use client";

import { CallList } from "./call-list";
import { CallPlayer } from "./call-player";
import { CallDialogs } from "./call-dialogs";
import { useCallRecordings } from "@/hooks/use-call-recordings";
import { CallRecordingsToolbar } from "./call-recordings-toolbar";
import { Sparkle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
export function CallRecordings() {
  const {
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
    selectedIds,
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
  } = useCallRecordings();

  // TODO: Implement search and filter handlers
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleFilter = (filterValue: string) => {
    console.log("Filter value:", filterValue);
  };

  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-background dark:via-background dark:to-blue-950 -z-10" />
      <div className="relative w-full flex items-start justify-center">
        <div className="shadow-xl w-full rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-background/80 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Sparkle className="text-blue-500 dark:text-blue-300 w-6 h-6" />
              </span>
              <span>
                <div className="text-xl font-bold">Call Recordings</div>
                <div className="text-muted-foreground text-sm">
                  Listen to and analyze your AI voice call recordings.
                </div>
              </span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="px-6 pt-2 justify-end flex">
            <CallRecordingsToolbar
              onSearchChange={handleSearch}
              onFilterChange={handleFilter}
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
                  selectedIds={selectedIds}
                  selectedCall={selectedCall}
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onSelectCall={handleSelectCall}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                  onDelete={handleDeleteRequest}
                  onMultiDelete={handleMultiDeleteRequest}
                  setCurrentPage={setCurrentPage}
                />
              </div>
              <div className="md:col-span-1 h-full flex flex-col min-h-0">
                <CallPlayer
                  selectedCall={selectedCall}
                  audioLoading={audioLoading}
                  audioUrl={audioUrl}
                  audioRef={audioRef}
                />
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

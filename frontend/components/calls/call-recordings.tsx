"use client"

import { CallList } from "./call-list"
import { CallPlayer } from "./call-player"
import { CallDialogs } from "./call-dialogs"
import { useCallRecordings } from "@/hooks/use-call-recordings"
import { CallRecordingsToolbar } from "./call-recordings-toolbar"

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
  }

  const handleFilter = (filterValue: string) => {
      console.log("Filter value:", filterValue); 
  }

  return (
    <div className="space-y-4">
      <CallRecordingsToolbar 
        onSearchChange={handleSearch} 
        onFilterChange={handleFilter} 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
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
        <div className="md:col-span-1">
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
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CallList } from "./call-list"
import { CallPlayer } from "./call-player"
import { CallDialogs } from "./call-dialogs"
import { fetchRecords, fetchAudio, deleteRecording, deleteMultipleRecordings } from "@/lib/apis"

export function CallRecordings() {
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [callRecordings, setData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecording, setSelectedRecording] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  useEffect(() => {
    setLoading(true)
    fetchRecords(currentPage, itemsPerPage)
      .then((data) => {
        setTotalItems(data.total)
        setData(data.items)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [currentPage, itemsPerPage])

  const handleSelectCall = async (call: any) => {
    try {
      setSelectedCall(call)
      setAudioLoading(true)
      setAudioUrl(null)
      const blob = await fetchAudio(call.audio_url)
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setAudioLoading(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.load()
        audioRef.current.play()
      }
    } catch (error: any) {
      setAudioLoading(false)
      console.error('Error playing audio:', error)
      toast({
        title: "Error",
        description: "Failed to play audio recording. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (recording: any) => {
    setSelectedRecording(recording)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedRecording) return
    try {
      await deleteRecording(selectedRecording.id)
      setData(callRecordings.filter((recording) => recording.id !== selectedRecording.id))
      setShowDeleteDialog(false)
      setSelectedRecording(null)
      toast({
        title: "Success",
        description: "Call recording deleted successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast({
        title: "Error",
        description: "Failed to delete call recording. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }
  const handleSelectAll = () => {
    if (selectedIds.length === callRecordings.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(callRecordings.map((call) => call.id))
    }
  }
  const handleMultiDelete = () => {
    setShowMultiDeleteDialog(true)
  }

  const confirmMultiDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      await deleteMultipleRecordings(selectedIds)
      setData(callRecordings.filter((rec) => !selectedIds.includes(rec.id)))
      setSelectedIds([])
      setShowMultiDeleteDialog(false)
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} call(s)`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected call recordings. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Recordings</h2>
          <p className="text-muted-foreground">Listen to and analyze your AI voice call recordings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search recordings..." className="w-[250px]" />
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="sms">SMS Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
            onDelete={handleDelete}
            onMultiDelete={handleMultiDelete}
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

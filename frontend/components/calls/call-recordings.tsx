"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const username = process.env.NEXT_PUBLIC_USERNAME
const password = process.env.NEXT_PUBLIC_PASSWORD
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export function CallRecordings() {
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [callRecordings, setData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])


  useEffect(()=>{
    const fetchRecords = async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/records?page=${currentPage}&per_page=${itemsPerPage}`)
      const data = await response.json()
      setTotalItems(data.total)
      return data.items
    }
    fetchRecords().then(records => {
      setData(records)
    })
  },[currentPage, itemsPerPage])

  const credentials = btoa(`${username}:${password}`)

  const handleSelectCall = async (call: any) => {
    try {
      setSelectedCall(call)
      const response = await fetch(call.audio_url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      })

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.load()
        audioRef.current.play()
      }
    } catch (error) {
      console.error('Error playing audio:', error)
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
            <SelectTrigger className="w-[180px]">
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
          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Call List</CardTitle>
              <CardDescription>Recent calls made by your AI voice agent</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callRecordings?.map((call) => (
                    <TableRow
                      key={call.id}
                      className={selectedCall?.id === call.id ? "bg-muted/50" : ""}
                      onClick={() => handleSelectCall(call)}
                    >
                      <TableCell className="font-medium">{call.invoice_number}</TableCell>
                      <TableCell>{call.created_at}</TableCell>
                      <TableCell>{call.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            call.status === "transferred"
                              ? "default"
                              : call.status === "sms"
                                ? "outline"
                                : (call.status === "no-answer" || call.status === "failed" || call.status === "busy")
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {call.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleSelectCall(call)}>
                          Play
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Call Player</CardTitle>
              <CardDescription>Listen to selected call recording</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCall ? (
                <>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">{selectedCall.first_name} {selectedCall.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCall.created_at}</p>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Badge
                        variant={
                          selectedCall.status === "Transferred"
                            ? "default"
                            : selectedCall.status === "SMS Sent"
                              ? "outline"
                              : selectedCall.status === "No Answer"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {selectedCall.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{selectedCall.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {audioUrl && (
                      <audio ref={audioRef} controls className="mt-4 w-full">
                        <source src={audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Transcript</h4>
                    <div className="max-h-64 overflow-y-auto rounded-md border p-4 text-sm">
                      {selectedCall.transcript}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      Share
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 mb-4"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <p>Select a call to play the recording</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CallRecordings() {
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSelectCall = (call: any) => {
    setSelectedCall(call)
    setCurrentTime(0)
    setIsPlaying(false)
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callRecordings.map((call) => (
                    <TableRow
                      key={call.id}
                      className={selectedCall?.id === call.id ? "bg-muted/50" : ""}
                      onClick={() => handleSelectCall(call)}
                    >
                      <TableCell className="font-medium">{call.customer}</TableCell>
                      <TableCell>{call.datetime}</TableCell>
                      <TableCell>{call.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            call.outcome === "Transferred"
                              ? "default"
                              : call.outcome === "SMS Sent"
                                ? "outline"
                                : call.outcome === "No Answer"
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {call.outcome}
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
                    <h3 className="font-medium">{selectedCall.customer}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCall.datetime}</p>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Badge
                        variant={
                          selectedCall.outcome === "Transferred"
                            ? "default"
                            : selectedCall.outcome === "SMS Sent"
                              ? "outline"
                              : selectedCall.outcome === "No Answer"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {selectedCall.outcome}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{selectedCall.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">0:00</span>
                      <span className="text-sm">{selectedCall.duration}</span>
                    </div>
                    <Slider value={[currentTime]} max={100} step={1} className="w-full" />
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                      >
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
                          className="h-4 w-4"
                        >
                          <polygon points="19 20 9 12 19 4 19 20"></polygon>
                          <line x1="5" y1="19" x2="5" y2="5"></line>
                        </svg>
                      </Button>
                      <Button size="icon" onClick={handlePlayPause}>
                        {isPlaying ? (
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
                            className="h-4 w-4"
                          >
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                        ) : (
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
                            className="h-4 w-4"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setCurrentTime(Math.min(100, currentTime + 10))}
                      >
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
                          className="h-4 w-4"
                        >
                          <polygon points="5 4 15 12 5 20 5 4"></polygon>
                          <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Transcript</h4>
                    <div className="max-h-64 overflow-y-auto rounded-md border p-4 text-sm">
                      {selectedCall.transcript.map((line: any, index: number) => (
                        <div
                          key={index}
                          className={`mb-2 ${line.speaker === "AI" ? "text-blue-600" : "text-gray-800"}`}
                        >
                          <span className="font-semibold">{line.speaker}: </span>
                          {line.text}
                        </div>
                      ))}
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

const callRecordings = [
  {
    id: "1",
    customer: "John Smith",
    datetime: "2023-05-10 10:24 AM",
    duration: "3:12",
    outcome: "Transferred",
    transcript: [
      {
        speaker: "David",
        text: "Hello, my name is David calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with John Smith?",
      },
      { speaker: "Customer", text: "Yes, this is John." },
      {
        speaker: "David",
        text: "Thank you John for confirming. I'm calling regarding an invoice for our claims management services. Please can you confirm whether you have received this payment from Barclays Bank?",
      },
      { speaker: "Customer", text: "Yes, I received that last week actually." },
      {
        speaker: "David",
        text: "Thank you for confirming. That's great to hear. We are glad we could assist. As per our no win, no fee agreement with you, our fee of £245 is now due. Are you in a position to make this payment today?",
      },
      { speaker: "Customer", text: "Yes, that would be fine." },
      {
        speaker: "David",
        text: "That's great. I can help you with that. We accept all major credit and debit cards. Would you prefer to be transferred to a member of our team to process your payment right now, or receive a secure payment link via SMS?",
      },
      { speaker: "Customer", text: "I'd prefer to speak with someone." },
      { speaker: "David", text: "I'll transfer you to our payments team right away. Please hold while I connect you." },
    ],
  }
]


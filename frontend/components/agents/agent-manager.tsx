"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AgentManager() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0])

  return (
    <Tabs defaultValue="agents" className="space-y-4">
      <TabsList>
        <TabsTrigger value="agents">Voice Agents</TabsTrigger>
        <TabsTrigger value="settings">Global Settings</TabsTrigger>
        <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
      </TabsList>

      <TabsContent value="agents">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Voice Agents</CardTitle>
              <CardDescription>Manage your AI voice agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="Search agents..." />
              </div>

              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${selectedAgent.id === agent.id ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${agent.active ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                    <Badge variant={agent.active ? "default" : "outline"}>{agent.active ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
              </div>

              <Button className="w-full">Create New Agent</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Agent Configuration</CardTitle>
                  <CardDescription>
                    {selectedAgent.name} - {selectedAgent.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedAgent.active ? "Active" : "Inactive"}</span>
                  <Switch checked={selectedAgent.active} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input id="agent-name" defaultValue={selectedAgent.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select defaultValue={selectedAgent.type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-description">Description</Label>
                <Input id="agent-description" defaultValue={selectedAgent.description} />
              </div>

              <div className="space-y-2">
                <Label>Voice Selection</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Emma (British Female)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                        <Badge>Selected</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">Charlotte (British Female - Formal)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Voice Parameters</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Speaking Rate</Label>
                      <span className="text-sm text-muted-foreground">1.0</span>
                    </div>
                    <Slider defaultValue={[1.0]} max={2.0} step={0.1} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Slower</span>
                      <span>Faster</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Pitch</Label>
                      <span className="text-sm text-muted-foreground">0.0</span>
                    </div>
                    <Slider defaultValue={[0.0]} min={-10.0} max={10.0} step={0.5} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Lower</span>
                      <span>Higher</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Script</Label>
                <Select defaultValue="default">
                  <SelectTrigger>
                    <SelectValue placeholder="Select default script" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Invoice Collection</SelectItem>
                    <SelectItem value="gentle">Gentle Reminder</SelectItem>
                    <SelectItem value="urgent">Urgent Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Behavior Settings</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="interrupt" className="flex-1 cursor-pointer">
                      Allow interruptions
                      <p className="text-xs text-muted-foreground">Agent will pause and respond when interrupted</p>
                    </Label>
                    <Switch id="interrupt" defaultChecked={selectedAgent.settings.allowInterruptions} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      Auto-transfer on request
                      <p className="text-xs text-muted-foreground">
                        Automatically transfer when customer requests human agent
                      </p>
                    </Label>
                    <Switch id="transfer" defaultChecked={selectedAgent.settings.autoTransfer} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="offtopic" className="flex-1 cursor-pointer">
                      Strict topic adherence
                      <p className="text-xs text-muted-foreground">Prevent agent from discussing off-topic matters</p>
                    </Label>
                    <Switch id="offtopic" defaultChecked={selectedAgent.settings.strictTopicAdherence} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <div className="flex gap-2">
                <Button variant="outline">Test Agent</Button>
                <Button>Save Changes</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Global Agent Settings</CardTitle>
            <CardDescription>Configure settings that apply to all voice agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Call Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximum Concurrent Calls</Label>
                  <Select defaultValue="10">
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum calls" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 calls</SelectItem>
                      <SelectItem value="10">10 calls</SelectItem>
                      <SelectItem value="20">20 calls</SelectItem>
                      <SelectItem value="50">50 calls</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Call Retry Attempts</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue placeholder="Select retry attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="2">2 attempts</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Call Time Restrictions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input type="time" defaultValue="09:00" />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input type="time" defaultValue="19:00" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Call Recording</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select recording option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Record all calls</SelectItem>
                      <SelectItem value="successful">Record successful calls only</SelectItem>
                      <SelectItem value="none">Don't record calls</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Telephony Integration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select defaultValue="twilio">
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="justcall">Just Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number Strategy</Label>
                  <Select defaultValue="random">
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random from Pool</SelectItem>
                      <SelectItem value="fixed">Fixed Number</SelectItem>
                      <SelectItem value="geo">Geo-Matched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Select defaultValue="twilio">
                    <SelectTrigger>
                      <SelectValue placeholder="Select SMS provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="vonage">Vonage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Warm Transfer Extension</Label>
                  <Input placeholder="e.g., 1001" defaultValue="2000" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select defaultValue="british-female">
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="british-female">British Female - Standard</SelectItem>
                      <SelectItem value="british-female-formal">British Female - Formal</SelectItem>
                      <SelectItem value="british-female-warm">British Female - Warm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Response Time</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select response time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Fast (Less thoughtful)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="slow">Slow (More thoughtful)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">0.7</span>
                </div>
                <Slider defaultValue={[0.7]} max={1.0} step={0.1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More focused</span>
                  <span>More creative</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto">Save Global Settings</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="knowledge">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>Manage the information your AI agents can access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Documents</h3>
                <Button>Add Document</Button>
              </div>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Document Name</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Added</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b">
                        <td className="p-3">{doc.name}</td>
                        <td className="p-3">
                          <Badge variant="outline">{doc.type}</Badge>
                        </td>
                        <td className="p-3">{doc.added}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Instructions</h3>

              <div className="space-y-2">
                <Label htmlFor="system-instructions">System Instructions</Label>
                <Textarea
                  id="system-instructions"
                  className="min-h-[150px]"
                  defaultValue="You are Emma, an AI voice agent for Allegiant Finance Services Ltd, an FCA-regulated claims management company that makes consumer financial misselling claims. Allegiant's website is https://allegiant.co.uk. Allegiant operates on a no-win, no-fee basis. Your purpose is to make outbound calls to customers regarding invoice payments for successful compensation claims. Maintain a professional, respectful, friendly and courteous tone throughout all interactions. Speak clearly with a natural British female accent at a measured pace to ensure customer understanding. Use natural language with minor variations in wording while preserving all regulatory elements. Avoid technical jargon, complex financial terminology, or pressuring language."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallback-responses">Fallback Responses</Label>
                <Textarea
                  id="fallback-responses"
                  className="min-h-[100px]"
                  defaultValue="I apologize, but I'm only able to discuss matters related to your outstanding invoice. Would you like to proceed with payment or would you prefer to speak with a human agent?"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto">Save Knowledge Base</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

const agents = [
  {
    id: "1",
    name: "Emma",
    description: "Primary British female voice for invoice collection",
    type: "outbound",
    active: true,
    settings: {
      allowInterruptions: true,
      autoTransfer: true,
      strictTopicAdherence: true,
    },
  },
  {
    id: "2",
    name: "Sarah",
    description: "Alternative British female voice",
    type: "outbound",
    active: false,
    settings: {
      allowInterruptions: true,
      autoTransfer: true,
      strictTopicAdherence: true,
    },
  },
  {
    id: "3",
    name: "Charlotte",
    description: "Formal British female voice",
    type: "outbound",
    active: false,
    settings: {
      allowInterruptions: false,
      autoTransfer: true,
      strictTopicAdherence: true,
    },
  },
]

const documents = [
  {
    id: "1",
    name: "Invoice Collection Process",
    type: "PDF",
    added: "2023-05-01",
  },
  {
    id: "2",
    name: "Payment Options Guide",
    type: "Text",
    added: "2023-05-02",
  },
  {
    id: "3",
    name: "Common Customer Questions",
    type: "Text",
    added: "2023-05-03",
  },
  {
    id: "4",
    name: "Legal Disclaimers",
    type: "PDF",
    added: "2023-05-04",
  },
  {
    id: "5",
    name: "Company Information",
    type: "Text",
    added: "2023-05-05",
  },
]


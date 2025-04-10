"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { CallDialog } from "./call-dialog"

interface Agent {
  id: number
  name: string
  voice: string
  status: string
  system_prompt: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export function AgentConfig() {
  const [agents, setAgents] = useState<Agent[]>()
  const [isActive, setIsActive] = useState(false)
  const [name, setName] = useState("")
  const [voice, setVoice] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false)
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchAgents = async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents`)
      const data = await response.json()
      return data
    }

    fetchAgents().then(agents => {
      setAgents(agents)
      // Fetch selected agent from backend
      const fetchSelectedAgent = async () => {
        const response = await fetch(`${API_BASE_URL}/api/v1/selected-agent`)
        const data = await response.json()
        if (data.selected_agent_id) {
          setSelectedAgentId(data.selected_agent_id)
        }
        const selectedAgent = agents?.find((agent: Agent) => agent.id === data.selected_agent_id)
        setSystemPrompt(selectedAgent?.system_prompt || "")
        setName(selectedAgent?.name || "")
        setVoice(selectedAgent?.voice || "")
        setIsActive(selectedAgent?.status === "active")
      }
      fetchSelectedAgent()
    })

  }, [])

  const handleAgentSelect = async (agentId: number) => {
    await fetch(`${API_BASE_URL}/api/v1/select-agent/${agentId}`, { method: 'POST' })
    setSelectedAgentId(agentId)
    const selectedAgent = agents?.find((agent: Agent) => agent.id === agentId)
    setSystemPrompt(selectedAgent?.system_prompt || "")
    setName(selectedAgent?.name || "")
    setVoice(selectedAgent?.voice || "")
    setIsActive(selectedAgent?.status === "active")
    router.refresh()
  }

  const handleSaveName = async () => {
    if (selectedAgentId) {
      const agent = {
        id: selectedAgentId,
        name,
        voice,
        system_prompt: systemPrompt,
        status: isActive ? 'active' : 'inactive'
      }
      await fetch(`${API_BASE_URL}/api/v1/agents`, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      })
      setIsEditingName(false)
      router.refresh()
    }
  }

  const handleSaveSystemPrompt = async () => {
    if (isEditingSystemPrompt) {
      const agent = {
        id: selectedAgentId,
        name,
        voice,
        system_prompt: systemPrompt,
        status: isActive ? 'active' : 'inactive'
      }
      await fetch(`${API_BASE_URL}/api/v1/agents`, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      })
      router.refresh()
    }
    setIsEditingSystemPrompt(!isEditingSystemPrompt)
  }

  const voices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <select
              value={selectedAgentId || ''}
              onChange={(e) => handleAgentSelect(Number(e.target.value))}
            >
              {agents?.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border rounded px-2 py-1"
                    autoFocus
                    onBlur={handleSaveName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingName(false)}>
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  {name || 'Select an agent'}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingName(true)}
                    className="ml-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardTitle>
            <CardDescription>Configure your AI voice agent's system prompt</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Toggle agent status"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="grid gap-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voiceOption) => (
                  <SelectItem key={voiceOption} value={voiceOption}>
                    {voiceOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <Label htmlFor="system-prompt" className="text-base font-medium">
              System Prompt
            </Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => handleSaveSystemPrompt()}
              >
                <Pencil className="h-4 w-4" />
                {isEditingSystemPrompt ? "Done" : "Edit"}
              </Button>
              <Button variant="outline" size="sm">
                Import
              </Button>
            </div>
          </div>
          <Textarea
            id="system-prompt"
            className="min-h-[500px] font-mono text-sm leading-relaxed"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            readOnly={!isEditingSystemPrompt}
          />
          <p className="text-sm text-muted-foreground">
            This system prompt defines how Emma will behave during calls. Include all script variations, handling
            instructions, and response guidelines in this prompt.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setIsCallDialogOpen(true)}>Test Agent</Button>
        <Button>Save Changes</Button>
      </CardFooter>
      
      <CallDialog
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        agentId={selectedAgentId || undefined}
      />
    </Card>
  )
}

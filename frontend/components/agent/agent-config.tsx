"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Pencil } from "lucide-react"
import { CallDialog } from "./call-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Agent } from "@/lib/props"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WordPronunciationDialog } from "./WordPronunciationDialog"
import {
  fetchAgents as apiFetchAgents,
  fetchSelectedAgent as apiFetchSelectedAgent,
  selectAgent as apiSelectAgent,
  updateAgent as apiUpdateAgent,
  controlTwilioCall,
} from "@/lib/apis"

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
  const [isWordDialogOpen, setIsWordDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAgentsData = async () => {
      const agents = await apiFetchAgents()
      setAgents(agents)
      // Fetch selected agent from backend
      const data = await apiFetchSelectedAgent()
      if (data.selected_agent_id) {
        setSelectedAgentId(data.selected_agent_id)
      }
      const selectedAgent = agents?.find((agent: Agent) => agent.id === data.selected_agent_id)
      setSystemPrompt(selectedAgent?.system_prompt || "")
      setName(selectedAgent?.name || "")
      setVoice(selectedAgent?.voice || "")
      setIsActive(selectedAgent?.status === "active")
    }
    fetchAgentsData()
  }, [])

  const handleAgentSelect = async (agentId: number) => {
    try {
      await apiSelectAgent(agentId)
      setSelectedAgentId(agentId)
      const selectedAgent = agents?.find((agent: Agent) => agent.id === agentId)
      setSystemPrompt(selectedAgent?.system_prompt || "")
      setName(selectedAgent?.name || "")
      setVoice(selectedAgent?.voice || "")
      setIsActive(selectedAgent?.status === "active")
      toast({
        title: "Success",
        description: "Agent selected successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Error selecting agent:', error)
      toast({
        title: "Error",
        description: "Failed to select agent. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveName = async () => {
    if (!selectedAgentId || !name) return
    try {
      const agent = {
        id: selectedAgentId,
        name,
        voice,
        system_prompt: systemPrompt,
        status: isActive ? 'active' : 'inactive'
      }
      await apiUpdateAgent(agent)
      setAgents(agents?.map(agent => 
        agent.id === selectedAgentId ? { ...agent, name } : agent
      ))
      setIsEditingName(false)
      toast({
        title: "Success",
        description: "Agent name updated successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Error updating agent name:', error)
      toast({
        title: "Error",
        description: "Failed to update agent name. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveSystemPrompt = async () => {
    if (!selectedAgentId || !systemPrompt) return
    if (isEditingSystemPrompt) {
      try {
        const agent = {
          id: selectedAgentId,
          name,
          voice,
          system_prompt: systemPrompt,
          status: isActive ? 'active' : 'inactive'
        }
        await apiUpdateAgent(agent)
        setAgents(agents?.map(agent => 
          agent.id === selectedAgentId ? { ...agent, system_prompt: systemPrompt } : agent
        ))
        setIsEditingSystemPrompt(false)
        toast({
          title: "Success",
          description: "System prompt updated successfully",
          variant: "default",
        })
        router.refresh()
      } catch (error) {
        console.error('Error updating system prompt:', error)
        toast({
          title: "Error",
          description: "Failed to update system prompt. Please try again.",
          variant: "destructive",
        })
      }
    }
    else {
      setIsEditingSystemPrompt(true)
    }
  }

  const handleStatusChange = async () => {
    if (!selectedAgentId) return
    try {
      const agent = {
        id: selectedAgentId,
        name,
        voice,
        system_prompt: systemPrompt,
        status: isActive ? 'active' : 'inactive'
      }
      await apiUpdateAgent(agent)
      setIsActive(!isActive)
      if (!isActive) {
        await controlTwilioCall('start_call')
      } else {
        await controlTwilioCall('stop_call')
      }
      setAgents(agents?.map(agent => 
        agent.id === selectedAgentId ? { ...agent, status: !isActive ? 'active' : 'inactive' } : agent
      ))
      toast({
        title: "Success",
        description: `Agent ${!isActive ? 'activated' : 'deactivated'} successfully`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error updating agent status:', error)
      toast({
        title: "Error",
        description: "Failed to update agent status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const voices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
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
          <div className="flex items-center gap-4">
            <div className="min-w-[200px]">
              <Select
                value={selectedAgentId ? String(selectedAgentId) : ''}
                onValueChange={(value) => handleAgentSelect(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map(agent => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={handleStatusChange}
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
              <Button variant="outline" size="sm" onClick={() => setIsWordDialogOpen(true)}>
                Words & Pronunciations
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
        {/* <Button variant="outline" onClick={() => setIsCallDialogOpen(true)}>Test Agent</Button> */}
        <div></div>
        <Button>Save Changes</Button>
      </CardFooter>
      
      <CallDialog
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        agentId={selectedAgentId || undefined}
      />
      <WordPronunciationDialog
        open={isWordDialogOpen}
        onOpenChange={setIsWordDialogOpen}
        agentId={selectedAgentId || undefined}
      />
    </Card>
  )
}

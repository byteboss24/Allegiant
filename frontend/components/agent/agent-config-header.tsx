"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import type { Agent } from "@/lib/props"

interface AgentConfigHeaderProps {
  agents: Agent[];
  selectedAgentId: number | null;
  selectedAgent: Agent | null;
  isLoading: boolean;
  handleAgentSelect: (agentId: number) => void;
  updateAgent: (updatedFields: Partial<Agent>) => Promise<Agent | null>;
  handleStatusChange: (newStatus: boolean) => void;
}

export function AgentConfigHeader({
  agents,
  selectedAgentId,
  selectedAgent,
  isLoading,
  handleAgentSelect,
  updateAgent,
  handleStatusChange,
}: AgentConfigHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(selectedAgent?.name || "")

  // Update local name state when selected agent changes
  useEffect(() => {
    setName(selectedAgent?.name || "")
    setIsEditingName(false) // Exit editing mode when agent changes
  }, [selectedAgent])

  const handleSaveName = async () => {
    if (!name.trim() || name === selectedAgent?.name) {
      setIsEditingName(false);
      setName(selectedAgent?.name || ""); // Reset if invalid or unchanged
      return;
    }
    const updated = await updateAgent({ name: name.trim() });
    if (updated) {
        setIsEditingName(false);
    } else {
        // Handle error case - maybe keep editing open?
         setName(selectedAgent?.name || ""); // Reset on error
    }
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <CardTitle className="text-2xl flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded px-2 py-1 bg-transparent" // Adjusted style
                autoFocus
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                disabled={isLoading} // Disable input while loading
              />
              {/* No need for Done button, uses blur/Enter */}
            </div>
          ) : (
            <>
              {selectedAgent?.name || 'Select an agent'}
              {selectedAgent && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingName(true)}
                  className="ml-2 h-6 w-6" // Smaller icon button
                  disabled={isLoading} // Disable edit button while loading
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </CardTitle>
        <CardDescription>Configure your AI voice agent's settings</CardDescription>
      </div>
      <div className="flex items-center gap-4">
        <div className="min-w-[200px]">
          <Select
            value={selectedAgentId ? String(selectedAgentId) : ''}
            onValueChange={(value) => handleAgentSelect(Number(value))}
            disabled={isLoading || isEditingName} // Disable select while loading or editing name
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
        {selectedAgent && (
          <>
            <Badge variant={selectedAgent.status === 'active' ? "default" : "secondary"}>
              {selectedAgent.status === 'active' ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={selectedAgent.status === 'active'}
              onCheckedChange={handleStatusChange}
              aria-label="Toggle agent status"
              disabled={isLoading || isEditingName} // Disable switch while loading or editing name
            />
          </>
        )}
      </div>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import type { AgentConfigHeaderProps } from "@/lib/props"
import { useAtomValue } from "jotai"
import { agentsAtom, isActiveAtom } from "@/lib/atom"

export function AgentConfigHeader({
  selectedAgentId,
  selectedAgent,
  isLoading,
  handleAgentSelect,
  updateAgent,
  handleStatusChange,
}: AgentConfigHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(selectedAgent?.name || "")
  const agents = useAtomValue(agentsAtom)
  const isActive = useAtomValue(isActiveAtom)
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
         setName(selectedAgent?.name || "");
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
                className="border rounded px-2 py-1 bg-transparent w-32 max-w-xs"
                autoFocus
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                disabled={isLoading || isActive}
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
                  className="ml-2 h-6 w-6"
                  disabled={isLoading || isActive}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </CardTitle>
        <CardDescription>Configure your AI voice agent's settings</CardDescription>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-4">
          <div className="min-w-[200px]">
            <Select
              value={selectedAgentId ? String(selectedAgentId) : ''}
              onValueChange={(value) => handleAgentSelect(Number(value))}
              disabled={isLoading || isEditingName || isActive}
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
              <Badge variant={selectedAgent.status === 'active' ? "default" : "destructive"}>
                {selectedAgent.status === 'active' ? "Active" : "Inactive"}
              </Badge>
              <div className="flex flex-col items-center">
                <Switch
                  checked={selectedAgent.status === 'active'}
                  onCheckedChange={handleStatusChange}
                  aria-label="Toggle agent status"
                  disabled={isLoading || isEditingName}
                />
              </div>
            </>
          )}
        </div>
        {selectedAgent && (
          <span className="text-xs text-muted-foreground mt-2 block">From 9:00 AM to 6:00 PM</span>
        )}
      </div>
    </div>
  )
} 
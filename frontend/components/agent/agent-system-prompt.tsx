"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"
import type { Agent } from "@/lib/props"

interface AgentSystemPromptProps {
  selectedAgent: Agent | null;
  isLoading: boolean;
  updateAgent: (updatedFields: Partial<Agent>) => Promise<Agent | null>;
  onOpenWordDialog: () => void;
}

export function AgentSystemPrompt({
  selectedAgent,
  isLoading,
  updateAgent,
  onOpenWordDialog,
}: AgentSystemPromptProps) {
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(selectedAgent?.system_prompt || "")

  // Update local prompt state when selected agent changes
  useEffect(() => {
    setSystemPrompt(selectedAgent?.system_prompt || "")
    setIsEditingSystemPrompt(false) // Exit editing mode when agent changes
  }, [selectedAgent])

  const handleSaveSystemPrompt = async () => {
    if (isEditingSystemPrompt) {
       // Only save if the prompt has actually changed
      if (systemPrompt !== selectedAgent?.system_prompt) {
          const updated = await updateAgent({ system_prompt: systemPrompt });
          if (updated) {
              setIsEditingSystemPrompt(false);
          } else {
              // Handle error - revert local state?
              setSystemPrompt(selectedAgent?.system_prompt || "");
          }
      } else {
          setIsEditingSystemPrompt(false); // Exit edit mode if no changes
      }
    } else {
      setIsEditingSystemPrompt(true) // Enter edit mode
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="system-prompt" className="text-base font-medium">
          System Prompt
        </Label>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleSaveSystemPrompt}
            disabled={isLoading || !selectedAgent} // Disable if loading or no agent selected
          >
            <Pencil className="h-4 w-4" />
            {isEditingSystemPrompt ? "Done" : "Edit"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenWordDialog}
            disabled={isLoading || !selectedAgent} // Disable if loading or no agent selected
           >
            Words & Pronunciations
          </Button>
        </div>
      </div>
      <Textarea
        id="system-prompt"
        className="min-h-[500px] font-mono text-sm leading-relaxed"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        readOnly={!isEditingSystemPrompt || isLoading} // Readonly if not editing or loading
        placeholder={!selectedAgent ? "Select an agent to view or edit the system prompt." : "Enter system prompt..."}
      />
      <p className="text-sm text-muted-foreground">
        This system prompt defines how the agent will behave. Include all script variations, handling instructions, and response guidelines.
      </p>
    </div>
  )
} 
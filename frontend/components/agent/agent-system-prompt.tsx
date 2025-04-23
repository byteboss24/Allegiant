"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import type { AgentSystemPromptProps } from "@/lib/props";
import { useAtomValue } from "jotai";
import { isActiveAtom } from "@/lib/atom";

export function AgentSystemPrompt({
  selectedAgent,
  isLoading,
  updateAgent,
  onOpenWordDialog,
}: AgentSystemPromptProps) {
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    selectedAgent?.system_prompt || ""
  );
  const isAgentActive = useAtomValue(isActiveAtom);

  // Update local prompt state when selected agent changes
  useEffect(() => {
    setSystemPrompt(selectedAgent?.system_prompt || "");
    setIsEditingSystemPrompt(false); // Exit editing mode when agent changes
  }, [selectedAgent]);

  const handleSaveSystemPrompt = async () => {
    if (isEditingSystemPrompt) {
      // Only save if the prompt has actually changed
      if (systemPrompt !== selectedAgent?.system_prompt) {
        const updated = await updateAgent({ system_prompt: systemPrompt });
        if (updated) {
          setIsEditingSystemPrompt(false);
        } else {
          setSystemPrompt(selectedAgent?.system_prompt || "");
        }
      } else {
        setIsEditingSystemPrompt(false);
      }
    } else {
      setIsEditingSystemPrompt(true);
    }
  };

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
            className={`flex items-center gap-1 ${
              isEditingSystemPrompt
                ? "bg-white hover:bg-gray-100 text-[#1f89de] hover:text-[#1f89de]"
                : "bg-[#1f89de] hover:bg-[#1f89de]/80 text-white hover:text-white"
            }`}
            onClick={handleSaveSystemPrompt}
            disabled={isLoading || !selectedAgent || isAgentActive}
          >
            <Pencil
              className="h-4 w-4"
              color={isEditingSystemPrompt ? "#1f89de" : "white"}
            />
            {isEditingSystemPrompt ? "Done" : "Edit"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWordDialog}
            disabled={isLoading || !selectedAgent}
            className="bg-[#1f89de] hover:bg-[#1f89de]/80 text-white hover:text-white"
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
        readOnly={!isEditingSystemPrompt || isLoading || isAgentActive}
        placeholder={
          !selectedAgent
            ? "Select an agent to view or edit the system prompt."
            : "Enter system prompt..."
        }
      />
      <p className="text-sm text-muted-foreground">
        This system prompt defines how the agent will behave. Include all script
        variations, handling instructions, and response guidelines.
      </p>
    </div>
  );
}

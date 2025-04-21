"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CallDialog } from "./call-dialog"
import { WordPronunciationDialog } from "./wordpronunciation-dialog"
import { useAgentConfig } from "@/hooks/useAgentConfig"
import { AgentConfigHeader } from "./agent-config-header"
import { AgentSystemPrompt } from "./agent-system-prompt"
import { Skeleton } from "@/components/ui/skeleton"

export function AgentConfig() {
  const {
    agents,
    selectedAgentId,
    selectedAgent,
    isLoading,
    handleAgentSelect,
    updateAgent,
    handleStatusChange,
  } = useAgentConfig();

  const [voice, setVoice] = useState(selectedAgent?.voice || "")
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [isWordDialogOpen, setIsWordDialogOpen] = useState(false)

  useEffect(() => {
    setVoice(selectedAgent?.voice || "")
  }, [selectedAgent])

  const handleVoiceChange = (newVoice: string) => {
    setVoice(newVoice);
  };

  const handleSaveChanges = async () => {
    if (!selectedAgent || isLoading) return;
    
    if (voice !== selectedAgent.voice) {
      await updateAgent({ voice: voice });
    } else {
      console.log("No changes to save for voice.");
    }
  };

  const voices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]

  if (isLoading && !agents.length) {
      return <AgentConfigSkeleton />; 
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <AgentConfigHeader
          agents={agents}
          selectedAgentId={selectedAgentId}
          selectedAgent={selectedAgent}
          isLoading={isLoading}
          handleAgentSelect={handleAgentSelect}
          updateAgent={updateAgent}
          handleStatusChange={handleStatusChange}
        />
      </CardHeader>
      <CardContent className="space-y-6">
         <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select 
              value={selectedAgent ? voice : ""}
              onValueChange={handleVoiceChange} 
              disabled={isLoading || !selectedAgent}
            >
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

         <AgentSystemPrompt
            selectedAgent={selectedAgent}
            isLoading={isLoading}
            updateAgent={updateAgent}
            onOpenWordDialog={() => setIsWordDialogOpen(true)}
          />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isLoading || !selectedAgent}>
          Save Changes
        </Button>
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

function AgentConfigSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
          <Skeleton className="min-h-[500px] w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}

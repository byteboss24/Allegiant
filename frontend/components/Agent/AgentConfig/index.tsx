"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WordPronunciationDialog } from "../WordPronunciationDialog";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { AgentConfigHeader } from "../AgentConfigHeader";
import { AgentSystemPrompt } from "../AgentSystemPrompt";
import { isActiveAtom } from "@/lib/atom";
import { useAtomValue } from "jotai";
import { Save } from "lucide-react";

export default function AgentConfig() {
  const {
    selectedAgentId,
    selectedAgent,
    isLoading,
    handleAgentSelect,
    updateAgent,
    handleStatusChange,
  } = useAgentConfig();

  const isActive = useAtomValue(isActiveAtom);

  const [voice, setVoice] = useState(selectedAgent?.voice || "");
  const [isWordDialogOpen, setIsWordDialogOpen] = useState(false);

  useEffect(() => {
    setVoice(selectedAgent?.voice || "");
  }, [selectedAgent]);

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

  const voices = [
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "onyx",
    "nova",
    "sage",
    "shimmer",
  ];

  return (
    <>
      <CardHeader>
        <AgentConfigHeader
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
        <Button
          onClick={handleSaveChanges}
          disabled={isLoading || !selectedAgent || isActive}
          className="bg-green-600 hover:bg-green-600/80"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardFooter>

      <WordPronunciationDialog
        open={isWordDialogOpen}
        onOpenChange={setIsWordDialogOpen}
        agentId={selectedAgentId || undefined}
      />
    </>
  );
}

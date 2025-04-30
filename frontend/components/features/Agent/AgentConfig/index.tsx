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
import AgentConfigHeader from "../AgentConfigHeader";
import AgentSystemPrompt from "../AgentSystemPrompt";
import { isActiveAtom, agentsAtom } from "@/lib/atom";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { Save } from "lucide-react";
import { toast } from "react-toastify";
import type { Agent } from "@/lib/datatypes";
import {
  fetchAgents as apiFetchAgents,
  fetchSelectedAgent as apiFetchSelectedAgent,
  selectAgent as apiSelectAgent,
  updateAgent as apiUpdateAgent,
  controlTwilioCall,
} from "@/lib/apis";

export default function AgentConfig() {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setIsActive = useSetAtom(isActiveAtom);
  const isActive = useAtomValue(isActiveAtom);

  // Fetch agent data
  const fetchAgentData = async () => {
    setIsLoading(true);
    try {
      const fetchedAgents = await apiFetchAgents();
      setAgents(fetchedAgents);
      const data = await apiFetchSelectedAgent();
      const currentSelectedId = data.selected_agent_id;
      setSelectedAgentId(currentSelectedId);
      if (currentSelectedId) {
        const agent = fetchedAgents.find((a: Agent) => a.id === currentSelectedId);
        setSelectedAgent(agent || null);
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
      toast.error("Failed to load agent data.", { hideProgressBar: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  // Handle agent select
  const handleAgentSelect = async (agentId: number) => {
    setIsLoading(true);
    try {
      await apiSelectAgent(agentId);
      setSelectedAgentId(agentId);
      const agent = agents.find((a: Agent) => a.id === agentId);
      setSelectedAgent(agent || null);
      toast.success("Agent selected successfully");
    } catch (error) {
      console.error("Error selecting agent:", error);
      toast.error("Failed to select agent.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update agent
  const updateAgent = async (updatedFields: Partial<Agent>, showToast: boolean = true) => {
    if (!selectedAgentId) return null;
    setIsLoading(true);
    const originalAgent = selectedAgent;
    const originalAgents = agents;
    const updatedAgentData = { ...originalAgent, ...updatedFields, id: selectedAgentId } as Agent;
    setSelectedAgent(updatedAgentData);
    setAgents((prevAgents) =>
      prevAgents.map((agent) => (agent.id === selectedAgentId ? updatedAgentData : agent))
    );
    try {
      await apiUpdateAgent(updatedAgentData);
      if (showToast) {
        toast.success("Agent updated successfully");
      }
      return updatedAgentData;
    } catch (error) {
      console.error("Error updating agent:", error);
      setSelectedAgent(originalAgent);
      setAgents(originalAgents);
      toast.error("Failed to update agent.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: boolean) => {
    if (!selectedAgent) return;
    setIsActive(newStatus);
    const isActive = newStatus;
    const action = isActive ? "start_call" : "stop_call";
    const updatedAgentData = { ...selectedAgent, status: isActive ? "active" : "inactive" };
    const updatedAgent = await updateAgent({ status: updatedAgentData.status }, false);
    if (updatedAgent) {
      try {
        toast.success(
          `Agent ${isActive ? "activated" : "deactivated"} and call process ${isActive ? "started" : "stopped"}.`
        );
        await controlTwilioCall(action);
      } catch (callError) {
        console.error(`Error trying to ${action}:`, callError);
        toast.error(
          `Agent status updated, but failed to ${action}. Please check backend status.`
        );
      }
    }
  };

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

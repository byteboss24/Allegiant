import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import type { Agent } from "@/lib/props"
import {
  fetchAgents as apiFetchAgents,
  fetchSelectedAgent as apiFetchSelectedAgent,
  selectAgent as apiSelectAgent,
  updateAgent as apiUpdateAgent,
  controlTwilioCall,
} from "@/lib/apis"

export function useAgentConfig() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchAgentData = useCallback(async () => {
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
      console.error('Error fetching agent data:', error)
      toast.error("Failed to load agent data.")
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
  }, [fetchAgentData]);

  const handleAgentSelect = useCallback(async (agentId: number) => {
    setIsLoading(true);
    try {
      await apiSelectAgent(agentId)
      setSelectedAgentId(agentId);
      const agent = agents.find((a: Agent) => a.id === agentId);
      setSelectedAgent(agent || null);
      toast.success("Agent selected successfully")
    } catch (error) {
      console.error('Error selecting agent:', error)
      toast.error("Failed to select agent.")
    } finally {
        setIsLoading(false);
    }
  }, [agents]);

  const updateAgent = useCallback(async (updatedFields: Partial<Agent>) => {
    if (!selectedAgentId) return null;
    setIsLoading(true);
    
    // Optimistic update preparation
    const originalAgent = selectedAgent;
    const originalAgents = agents;

    // Apply optimistic update
    const updatedAgentData = { ...originalAgent, ...updatedFields, id: selectedAgentId } as Agent;
    setSelectedAgent(updatedAgentData);
    setAgents(prevAgents => 
        prevAgents.map(agent => 
            agent.id === selectedAgentId ? updatedAgentData : agent
        )
    );

    try {
      await apiUpdateAgent(updatedAgentData);
      
      toast.success("Agent updated successfully")
      return updatedAgentData;
    } catch (error) {
      console.error('Error updating agent:', error)
      // Rollback optimistic update on failure
      setSelectedAgent(originalAgent);
      setAgents(originalAgents);
      toast.error("Failed to update agent.")
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgentId, selectedAgent, agents]);

  const handleStatusChange = useCallback(async (newStatus: boolean) => {
    if (!selectedAgent) return;
    
    const isActive = newStatus;
    const action = isActive ? 'start_call' : 'stop_call';
    const updatedAgentData = { ...selectedAgent, status: isActive ? 'active' : 'inactive' };

    // Update agent status first
    const updatedAgent = await updateAgent({ status: updatedAgentData.status });

    // If agent update was successful, attempt to control Twilio call
    if (updatedAgent) {
        try {
            await controlTwilioCall(action); 
            toast.success(`Agent ${isActive ? 'activated' : 'deactivated'} and call process ${isActive ? 'started' : 'stopped'}.`);
        } catch (callError) {
            console.error(`Error trying to ${action}:`, callError);
            toast.error(`Agent status updated, but failed to ${action}. Please check backend status.`);
        }
    }
  }, [selectedAgent, updateAgent]);


  return {
    agents,
    selectedAgentId,
    selectedAgent,
    isLoading,
    handleAgentSelect,
    updateAgent,
    handleStatusChange,
  };
} 
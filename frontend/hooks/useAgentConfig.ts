import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()

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
      toast({
        title: "Error",
        description: "Failed to load agent data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
      toast({
        title: "Success",
        description: "Agent selected successfully",
      })
    } catch (error) {
      console.error('Error selecting agent:', error)
      toast({
        title: "Error",
        description: "Failed to select agent.",
        variant: "destructive",
      })
    } finally {
        setIsLoading(false);
    }
  }, [agents, toast]);

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
      const updatedAgentFromServer = await apiUpdateAgent(updatedAgentData); // Send full updated agent data
      
      // Update state with server response (might include more fields or confirmed data)
      setSelectedAgent(updatedAgentFromServer);
      setAgents(prevAgents => 
        prevAgents.map(agent => 
            agent.id === updatedAgentFromServer.id ? updatedAgentFromServer : agent
        )
      );
      
      toast({
        title: "Success",
        description: "Agent updated successfully",
      })
      router.refresh(); // Refresh server components if needed
      return updatedAgentFromServer;
    } catch (error) {
      console.error('Error updating agent:', error)
      // Rollback optimistic update on failure
      setSelectedAgent(originalAgent);
      setAgents(originalAgents);
      toast({
        title: "Error",
        description: "Failed to update agent.",
        variant: "destructive",
      })
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgentId, selectedAgent, agents, toast, router]);

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
            toast({ 
                title: "Success", 
                description: `Agent ${isActive ? 'activated' : 'deactivated'} and call process ${isActive ? 'started' : 'stopped'}.` 
            });
        } catch (callError) {
            console.error(`Error trying to ${action}:`, callError);
            toast({ 
                title: "Warning", 
                description: `Agent status updated, but failed to ${action}. Please check backend status.`, 
                variant: "destructive" 
            });
            // Consider if you need to revert the agent status change here
        }
    }
  }, [selectedAgent, updateAgent, toast]);


  return {
    agents,
    selectedAgentId,
    selectedAgent,
    isLoading,
    handleAgentSelect,
    updateAgent, // Generic update function
    handleStatusChange, // Specific handler for status toggle
  };
} 
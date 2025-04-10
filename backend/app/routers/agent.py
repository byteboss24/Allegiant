from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.model.agent import Agent
from app.services.mysql import mysql_service

router = APIRouter(
    prefix="/api/v1",
    tags=["agents"]
)

# Global variable to store selected agent ID
selected_agent_id: Optional[int] = 1

@router.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    return await mysql_service.get_agent_by_id(agent_id)

@router.get("/agents", response_model=List[Agent])
async def get_agents():
    return await mysql_service.get_all_agents()

@router.post("/agents")
async def create_agent(agent: Agent):
    response = await mysql_service.insert_agent(agent.name, agent.system_prompt, agent.voice, agent.status)
    print("Created agent:", response)
    return response

@router.put("/agents")
async def update_agent(agent: Agent):
    return await mysql_service.update_agent(agent.id, name=agent.name, system_prompt=agent.system_prompt, voice=agent.voice, status=agent.status)

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: int):
    return await mysql_service.delete_agent(agent_id)

@router.get("/selected-agent")
async def get_selected_agent():
    return {"selected_agent_id": selected_agent_id}

@router.post("/select-agent/{agent_id}")
async def select_agent(agent_id: int):
    global selected_agent_id
    selected_agent_id = agent_id
    return {"message": f"Agent {agent_id} selected successfully"}

@router.post("/initialize-openai-session")
async def initialize_openai_session():
    if not selected_agent_id:
        raise HTTPException(status_code=400, detail="No agent selected")
    
    agent_data = await mysql_service.get_agent_by_id(selected_agent_id)
    
    # Initialize OpenAI session with agent's voice model and settings
    # Your OpenAI initialization code here using agent_data
    
    return {"message": "OpenAI session initialized with agent settings"}

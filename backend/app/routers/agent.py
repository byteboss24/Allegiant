from typing import List, Optional
from fastapi import APIRouter
from app.model.agent import Agent
from app.services.agent import agent_service, agent_task_service
from app.services.mysql import mysql_service
from app.core.config import settings

router = APIRouter(
    prefix="/api/v1",
    tags=["agents"]
)

# Global variable to store selected agent ID
selected_agent_id: Optional[int] = 1

@router.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    return await agent_service.get_agent_by_id(agent_id)

@router.get("/agents", response_model=List[Agent])
async def get_agents():
    return await agent_service.get_agents()

@router.post("/agents")
async def create_agent(agent: Agent):
    response = await agent_service.create_agent(agent)
    print("Created agent:", response)
    return response

@router.put("/agents")
async def update_agent(agent: Agent):
    return await agent_service.update_agent(agent.id, agent)

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: int):
    return await agent_service.delete_agent(agent_id)

@router.get("/selected-agent")
async def get_selected_agent():
    return {"selected_agent_id": selected_agent_id}

@router.post("/select-agent/{agent_id}")
async def select_agent(agent_id: int):
    global selected_agent_id
    selected_agent_id = agent_id
    return {"message": f"Agent {agent_id} selected successfully"}

@router.get("/start-task")
async def startup_event():
    await agent_task_service.start_task(selected_agent_id)
    return {"message": "Task started"}

@router.get("/stop-task")
async def stop_event():
    await agent_task_service.stop_task(selected_agent_id)
    return {"message": "Task stopped"}
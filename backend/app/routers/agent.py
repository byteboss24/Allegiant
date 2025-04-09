from typing import List
from fastapi import APIRouter
from app.model.agent import Agent
from app.services.mysql import mysql_service

router = APIRouter(
    prefix="/api/v1",
    tags=["agents"]
)

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

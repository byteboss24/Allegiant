from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.model.agent import Agent
from app.services.mysql import mysql_service
import threading
import time
import asyncio
import httpx

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

task_thread = None
agent = None

async def run_task():
    global agent
    while agent['status'] == "active":
        try:
            # Get all pending invoices
            invoices = await mysql_service.get_invoices()

            for invoice in invoices:
                print(invoice['invoice_number'])

                # Make asynchronous HTTP call
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://ce8e-194-37-82-18.ngrok-free.app/twilio/outbound",
                        headers={"Content-Type": "application/json"},
                        json={"invoice_number": str(invoice['invoice_number'])}
                    )
                    response.raise_for_status()

                print(f"Initiated call to {invoice['invoice_number']} for invoice {invoice['id']}")
                await asyncio.sleep(5)  # Rate limiting

            await asyncio.sleep(60)  # Check for new invoices every minute

        except Exception as e:
            print(f"Outbound task error: {str(e)}")
            await asyncio.sleep(30)

async def start_task():
    global task_thread, agent
    agent = await mysql_service.get_agent_by_id(selected_agent_id)
    if agent['status'] == "active":
        task_thread = threading.Thread(target=lambda: asyncio.run(run_task()), daemon=True)  # Daemon thread
        task_thread.start()
        print("Task started!")

async def stop_task():
    global task_thread, agent
    agent = await mysql_service.get_agent_by_id(selected_agent_id)
    if agent and agent['status'] == "inactive":
        task_thread.join()  # Wait for the thread to finish
        print("Task stopped!")
    else:
        print("No task is running!")

@router.get("/start-task")
async def startup_event():
    await start_task()
    return {"message": "Task started"}

@router.get("/stop-task")
async def stop_event():
    await stop_task()
    return {"message": "Task stopped"}
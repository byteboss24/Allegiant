from typing import List, Optional
from app.model.agent import Agent
from app.services.mysql import mysql_service
from app.core.config import settings
import asyncio
import threading
import httpx

class AgentService:
    def __init__(self):
        pass

    async def get_agents(self) -> List[Agent]:
        return await mysql_service.get_agents()

    async def get_agent_by_id(self, agent_id: int) -> Optional[Agent]:
        return await mysql_service.get_agent_by_id(agent_id)

    async def create_agent(self, agent: Agent) -> Optional[Agent]:
        return await mysql_service.insert_agent(agent.name, agent.system_prompt, agent.voice, agent.status)

    async def update_agent(self, agent_id: int, agent: Agent) -> Optional[Agent]:
        return await mysql_service.update_agent(agent_id, name=agent.name, system_prompt=agent.system_prompt, voice=agent.voice, status=agent.status)

    async def delete_agent(self, agent_id: int) -> bool:
        return await mysql_service.delete_agent(agent_id)

agent_service = AgentService()

class AgentTaskService:
    def __init__(self):
        self.task_thread = None
        self.agent = None

    async def run_task(self):
        while self.agent and self.agent.status == "active":
            try:
                invoices = await mysql_service.get_invoices()
                for invoice in invoices:
                    async with httpx.AsyncClient() as client:
                        await client.post(
                            f"https://{settings.fastapi_domain}/twilio/outbound",
                            headers={"Content-Type": "application/json"},
                            json={"invoice_number": str(invoice.invoice_number)}
                        )
                    await asyncio.sleep(5)
                await asyncio.sleep(60)
            except Exception as e:
                print(f"Outbound task error: {str(e)}")
                await asyncio.sleep(30)

    async def start_task(self, agent_id: int):
        self.agent = await agent_service.get_agent_by_id(agent_id)
        if self.agent.status == "active":
            self.task_thread = threading.Thread(
                target=lambda: asyncio.run(self.run_task()),
                daemon=True
            )
            self.task_thread.start()

    async def stop_task(self, agent_id: int):
        self.agent = await agent_service.get_agent_by_id(agent_id)
        if self.agent and self.agent.status == "inactive":
            self.task_thread.join()

agent_task_service = AgentTaskService()

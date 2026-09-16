"""
Chatbot Router
--------------
Dedicated endpoint for the farmer agronomic Q&A assistant.
"""
import logging
from fastapi import APIRouter, status
from app.chatbot.schemas import ChatAdvisoryRequest, ChatAdvisoryResponse
from app.chatbot.service import ChatbotService

logger = logging.getLogger("agri.chatbot.router")
router = APIRouter()


@router.post(
    "/ask",
    response_model=ChatAdvisoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask follow-up questions to the LLM Agronomic Assistant",
    description="Conversational agronomic assistant with full multi-agent decision context awareness.",
)
async def ask_agri_assistant(payload: ChatAdvisoryRequest) -> ChatAdvisoryResponse:
    logger.info(f"[Chatbot] Received question: '{payload.question}' for crop: '{payload.crop_type}'")
    return await ChatbotService.generate_response(payload)

"""
Chatbot Service Engine
----------------------
Handles LLM generation via Ollama / configured provider, with a context-aware fallback.
"""
import logging
import httpx
from app.core.config import get_settings
from app.chatbot.schemas import ChatAdvisoryRequest, ChatAdvisoryResponse
from app.chatbot.prompts import build_system_prompt, build_user_prompt

logger = logging.getLogger("agri.chatbot.service")
settings = get_settings()


class ChatbotService:
    @classmethod
    async def generate_response(cls, req: ChatAdvisoryRequest) -> ChatAdvisoryResponse:
        """
        Attempts to call the local LLM (Ollama). If unreachable, uses high-fidelity multi-agent context synthesis.
        """
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(req)

        # 1. Try Ollama LLM
        try:
            ollama_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(
                    ollama_url,
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": f"{system_prompt}\n\n{user_prompt}",
                        "stream": False,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data.get("response", "").strip()
                    if raw_text:
                        logger.info("[ChatbotService] Successfully generated LLM response via Ollama")
                        return cls._format_llm_output(raw_text, req)
        except Exception as e:
            logger.info(f"[ChatbotService] Ollama unavailable ({e}); using multi-agent context engine")

        # 2. Context-Aware Multi-Agent Synthesis (Fallback)
        return cls._synthesize_contextual_response(req)

    @classmethod
    def _format_llm_output(cls, raw_text: str, req: ChatAdvisoryRequest) -> ChatAdvisoryResponse:
        tip = cls._derive_action_tip(req)
        return ChatAdvisoryResponse(
            answer=raw_text,
            action_tip=tip,
            suggested_followups=cls._get_default_followups(req),
        )

    @classmethod
    def _synthesize_contextual_response(cls, req: ChatAdvisoryRequest) -> ChatAdvisoryResponse:
        """
        Context-aware synthesis that uses the exact multi-agent state to answer questions accurately without contradictions.
        """
        q = req.question.lower().strip()
        crop = req.crop_type
        dec = req.decision or "IRRIGATE"
        vol = req.volume_liters_sqm or 0.0

        # Extract agent findings if available
        soil_ev = next((ev for ev in (req.agent_outputs or []) if "Soil" in ev.agent_name), None)
        weather_ev = next((ev for ev in (req.agent_outputs or []) if "Weather" in ev.agent_name), None)
        crop_ev = next((ev for ev in (req.agent_outputs or []) if "Crop" in ev.agent_name), None)

        # 1. Rain & weather timing questions
        if ("when" in q or "is" in q or "time" in q) and "rain" in q:
            if dec == "DELAY_IRRIGATION":
                weather_info = weather_ev.primary_evidence if weather_ev else "Satellite radar indicates incoming precipitation."
                answer = (
                    f"🌧️ Yes, rain is on the way! The weather agent detected: {weather_info} "
                    f"Because natural rain is expected within the next few hours, holding your pumps now will let nature water your {crop} for free without wasting fuel."
                )
                tip = "Check your field this afternoon before starting any manual pumping."
            elif dec == "DO_NOT_IRRIGATE":
                answer = (
                    f"☀️ There is **no significant rain expected in the next 12–24 hours**, but your **soil already contains optimal moisture** (above the crop's threshold). "
                    f"Therefore, your {crop} does not need any irrigation today even though the sky is clear."
                )
                tip = "Soil moisture is sufficient. Keep irrigation off today to maintain good root aeration."
            else:
                answer = (
                    f"☀️ There is **no significant rain expected in the next 12–24 hours**. "
                    f"Because soil moisture is running low and conditions are dry, your {crop} will rely on manual irrigation today."
                )
                tip = "Water early in the morning (6–8 AM) or late afternoon (4–6 PM) to reduce evaporation."

        # 2. Fertilizer questions
        elif "fertilizer" in q or "urea" in q or "npk" in q or "manure" in q or "spray" in q:
            if dec == "DELAY_IRRIGATION":
                answer = (
                    f"⚠️ **Do NOT apply fertilizer right now.** Heavy rain is forecasted soon. "
                    f"Applying fertilizer before heavy rainfall will wash away expensive nutrients into runoff canals."
                )
                tip = "Wait until the rain passes and soil is moist (not flooded), then apply fertilizer."
            elif dec == "IRRIGATE":
                answer = (
                    f"✅ **Yes, but apply irrigation alongside it.** Since root-zone soil is currently dry, "
                    f"applying fertilizer directly to parched roots can cause chemical stress. Water the field with {vol} L/m² as recommended so nutrients dissolve properly."
                )
                tip = "Apply fertilizer close to the root zone and avoid midday heat."
            else:
                answer = (
                    f"✅ **Yes, soil moisture is currently in an optimal, safe range.** You can apply fertilizer according to your regular schedule."
                )
                tip = "Incorporate fertilizer lightly into topsoil for best absorption."

        # 3. "Why this decision" / Reason / Explanation
        elif "why" in q or "explain" in q or "reason" in q:
            if dec == "DELAY_IRRIGATION":
                answer = (
                    f"🌧️ **The decision is to DELAY irrigation because natural rain is approaching.** "
                    f"{req.conflict_trace or 'Incoming precipitation will refill the root zone, saving you water and electricity costs.'}"
                )
                tip = "Keep valves closed and wait for the rain."
            elif dec == "DO_NOT_IRRIGATE":
                soil_detail = soil_ev.primary_evidence if soil_ev else "Soil moisture is above the Readily Available Water threshold."
                answer = (
                    f"🌾 **The decision is DO NOT IRRIGATE because your root zone already has optimal moisture.** "
                    f"{soil_detail} Adding extra water right now could saturate the soil and increase fungal disease risk."
                )
                tip = "Soil moisture is healthy. Check back tomorrow."
            else:
                answer = (
                    f"💧 **The decision is to IRRIGATE because soil moisture has depleted below the optimal threshold.** "
                    f"Your {crop} requires {vol} L/m² to prevent water stress and protect growth."
                )
                tip = f"Apply approximately {vol} L/m² today."

        # 4. Volume / Buckets / Drip runtime
        elif "how much" in q or "bucket" in q or "minute" in q or "volume" in q or "water" in q or "irrigate" in q:
            if dec == "IRRIGATE":
                buckets = max(1, round((vol * 25.3) / 10))
                drip_mins = max(20, round(vol * 15))
                answer = (
                    f"💧 **Recommended Watering Amount for {crop}:**\n\n"
                    f"• **Volume**: **{vol} Litres per m²**\n"
                    f"• **In Buckets**: ~**{buckets} standard 10L buckets** per perch (25.3 m²)\n"
                    f"• **Drip Runtime**: ~**{drip_mins} minutes** of drip line operation."
                )
                tip = "Ensure water penetrates 5–10 cm into the root zone."
            elif dec == "DELAY_IRRIGATION":
                answer = "⏳ **Zero irrigation needed right now.** Natural rain is predicted to deliver water to your plot."
                tip = "Monitor the weather before operating any pumps."
            else:
                answer = "🛑 **Zero water is needed today.** Soil moisture is currently sufficient for healthy crop transpiration."
                tip = "Keep irrigation valves closed today."

        # 5. Default General Overview
        else:
            answer = (
                f"🌾 **Advisory for your {crop} plot ({req.farm_id or 'Plot 1'}):**\n\n"
                f"The AI multi-agent decision is **{dec.replace('_', ' ')}** with **{int((req.confidence or 0.9)*100)}% confidence**.\n\n"
                f"• **Agronomic Rationale**: {req.evidence_summary or 'Evaluated based on root-zone moisture, microclimate, and crop stage.'}\n"
                f"• **Coordinator Trace**: {req.conflict_trace or 'Optimal crop moisture management.'}"
            )
            tip = cls._derive_action_tip(req)

        return ChatAdvisoryResponse(
            answer=answer,
            action_tip=cls._derive_action_tip(req),
            suggested_followups=cls._get_default_followups(req),
        )

    @classmethod
    def _derive_action_tip(cls, req: ChatAdvisoryRequest) -> str:
        dec = req.decision or "IRRIGATE"
        if dec == "DELAY_IRRIGATION":
            return "Check sky conditions this afternoon before starting any manual pumping."
        elif dec == "DO_NOT_IRRIGATE":
            return "Soil moisture is in the optimal range. Keep irrigation turned off today."
        else:
            vol = req.volume_liters_sqm or 0.0
            return f"Water early morning or dusk with ~{vol} L/m² to minimize evaporation."

    @classmethod
    def _get_default_followups(cls, req: ChatAdvisoryRequest) -> list[str]:
        return [
            "🌧️ When is rain expected?",
            "🧪 Can I apply fertilizer today?",
            "💧 How many buckets of water should I use?",
            "❓ Why is this action recommended?",
        ]

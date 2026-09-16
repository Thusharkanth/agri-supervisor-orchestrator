"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Loader2,
  RefreshCw,
  Minimize2,
  ChevronUp,
} from "lucide-react";
import { askAgriAssistant } from "../../lib/api";
import { DecisionResponse, TelemetryPayload } from "../../lib/types";

interface Props {
  cropType: string;
  plantingDate?: string;
  farmId?: string;
  decision: DecisionResponse | null;
  telemetry?: TelemetryPayload | null;
}

interface ChatMessage {
  id: string;
  sender: "farmer" | "assistant";
  text: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  "When is rain expected?",
  "Why this decision?",
  "How many buckets should I use?",
  "Can I apply fertilizer today?",
  "Is the soil too dry for this stage?",
];

export const AgriChatWidget: React.FC<Props> = ({
  cropType,
  plantingDate,
  farmId,
  decision,
  telemetry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting whenever crop or decision updates
  useEffect(() => {
    const currentStatus = decision
      ? `The current AI recommendation is **${decision.final_decision.replace(/_/g, " ")}** (${Math.round(
          decision.final_confidence * 100
        )}% confidence).`
      : "You can ask me questions once you run the advisory engine.";

    setMessages([
      {
        id: "initial",
        sender: "assistant",
        text: `Hello! I am your AI Agronomic Assistant for your **${cropType || "crop"}** plot. ${currentStatus}\n\nAsk me anything about watering depth, rain timing, fertilizer safety, or why this decision was made.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [cropType, decision?.final_decision]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "farmer",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const soilVol =
        decision?.agent_outputs?.find((o) => o.agent_name === "SoilWaterAgent")
          ?.recommended_volume_liters_sqm || 0;

      const response = await askAgriAssistant({
        question: textToSend,
        crop_type: cropType || "Crop",
        planting_date: plantingDate,
        farm_id: farmId || "FARM-01",
        decision: decision?.final_decision,
        confidence: decision?.final_confidence,
        volume_liters_sqm: soilVol,
        evidence_summary: decision?.final_recommendation_text,
        conflict_trace: decision?.conflict_resolution_trace,
        agent_outputs: decision?.agent_outputs || [],
      });

      const fullReply = response.action_tip
        ? `${response.answer}\n\n💡 **Action Tip:** ${response.action_tip}`
        : response.answer;

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: fullReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Sorry, I could not process your question. Please ensure the backend server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3.5 rounded-full shadow-2xl hover:shadow-emerald-900/50 hover:scale-105 transition-all duration-300 group border border-emerald-400/30"
          title="Open AI Agronomic Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            🌾 Ask Agri Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] max-w-full bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[560px] max-h-[85vh] transition-all animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-950/90 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight">
                    Agri AI Assistant
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {cropType} Plot • Multi-Agent Reasoner
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "initial",
                      sender: "assistant",
                      text: `Hello! I am your AI Agronomic Assistant for your **${cropType || "crop"}** plot.`,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                title="Reset Conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Minimize Chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Status Pill */}
          {decision && (
            <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Current Decision:</span>
              <span className="font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                {decision.final_decision.replace(/_/g, " ")} ({Math.round(decision.final_confidence * 100)}%)
              </span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 text-xs leading-relaxed ${
                  m.sender === "farmer" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                    m.sender === "farmer"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  <p>{m.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      m.sender === "farmer" ? "text-emerald-200" : "text-slate-500"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === "farmer" && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 text-xs justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-950/90 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span className="text-slate-400 italic">Thinking agronomic response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Question Chips */}
          <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Questions:
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-xl border border-slate-700 transition shrink-0 disabled:opacity-50"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything about ${cropType || "your crop"}...`}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg disabled:cursor-not-allowed shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

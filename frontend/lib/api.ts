import {
  DecisionRequest,
  DecisionResponse,
  FeedbackRequest,
  FeedbackResponse,
  TelemetryPayload,
  DecisionHistoryItem,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchLiveTelemetry(
  lat: number,
  lon: number,
  forceRefresh: boolean = false
): Promise<TelemetryPayload> {
  const url = `${API_BASE_URL}/api/v1/telemetry/live?latitude=${lat}&longitude=${lon}&force_refresh=${forceRefresh}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch telemetry: ${res.statusText}`);
  }
  return res.json();
}

export async function requestIrrigationDecision(
  payload: DecisionRequest
): Promise<DecisionResponse> {
  const url = `${API_BASE_URL}/api/v1/decisions/irrigate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Decision API error: ${errText || res.statusText}`);
  }
  return res.json();
}

export async function submitFarmerFeedback(
  payload: FeedbackRequest
): Promise<FeedbackResponse> {
  const url = `${API_BASE_URL}/api/v1/decisions/feedback`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Feedback API error: ${errText || res.statusText}`);
  }
  return res.json();
}

export async function fetchDecisionHistory(
  farmId?: string
): Promise<DecisionHistoryItem[]> {
  const query = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
  const url = `${API_BASE_URL}/api/v1/decisions/history${query}`;
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function askAgriAssistant(
  payload: import("./types").ChatAdvisoryRequest
): Promise<import("./types").ChatAdvisoryResponse> {
  const url = `${API_BASE_URL}/api/v1/chat/ask`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Chat API error: ${errText || res.statusText}`);
  }
  return res.json();
}

export async function evaluateBenchmarkScenario(payload: any): Promise<DecisionResponse> {
  const url = `${API_BASE_URL}/api/v1/decisions/benchmark/evaluate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Benchmark evaluation error");
  }
  return res.json();
}


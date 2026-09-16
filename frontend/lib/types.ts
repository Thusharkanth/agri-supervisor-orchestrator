export type ClaimType = "IRRIGATE" | "DO_NOT_IRRIGATE" | "DELAY_IRRIGATION" | "NEUTRAL";
export type DecisionType = "IRRIGATE" | "DO_NOT_IRRIGATE" | "DELAY_IRRIGATION";

export interface AgentEvidence {
  agent_name: string;
  claim: ClaimType;
  recommended_volume_liters_sqm: number;
  confidence_score: number;
  primary_evidence: string;
  telemetry_timestamp: string;
  data_freshness_seconds: number;
  staleness_warning: boolean;
}

export interface DecisionRequest {
  farm_id: string;
  crop_type: string;
  latitude: number;
  longitude: number;
  planting_date: string;
  request_id?: string;
}

export interface DecisionResponse {
  decision_id: number | null;
  request_id?: string;
  farm_id: string;
  crop_type: string;
  latitude: number;
  longitude: number;
  planting_date: string;
  final_decision: DecisionType;
  final_confidence: number;
  conflict_detected: boolean;
  conflict_resolution_trace?: string;
  final_recommendation_text?: string;
  agent_outputs: AgentEvidence[];
  timestamp: string;
}

export interface HourlyTelemetry {
  time: string[];
  precipitation_probability: number[];
  precipitation: number[];
  soil_moisture_0_to_1cm?: number[];
  soil_moisture_3_to_9cm: number[];
  et0_fao_evapotranspiration?: number[];
  temperature_2m?: number[];
}

export interface TelemetryPayload {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  hourly: HourlyTelemetry;
  fetched_at: string;
  source: string;
  cached: boolean;
  staleness_warning: boolean;
}

export interface FeedbackRequest {
  decision_id: number;
  action: "ACCEPT" | "OVERRIDE";
  override_decision?: DecisionType;
  notes?: string;
}

export interface FeedbackResponse {
  status: string;
  message: string;
  feedback_id: number;
  decision_id: number;
  action: string;
  created_at: string;
}

export interface DecisionHistoryItem {
  id: number;
  farm_id: string;
  crop_type: string;
  latitude: number;
  longitude: number;
  planting_date: string;
  final_decision: DecisionType;
  final_confidence: number;
  conflict_detected: boolean;
  conflict_resolution_trace?: string;
  final_recommendation_text?: string;
  created_at: string;
}

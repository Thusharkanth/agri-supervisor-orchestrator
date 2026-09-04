# Multi-Agent Agricultural Decision-Support System

[![Architecture: LangGraph Parallel Fan-Out/Fan-In](https://img.shields.io/badge/Architecture-LangGraph%20Parallel%20Fan--Out%2FIn-blue)](https://github.com/langchain-ai/langgraph)
[![Framework: FastAPI Async](https://img.shields.io/badge/API-FastAPI%20Async-green)](https://fastapi.tiangolo.com/)
[![Frontend: Next.js 14 App Router](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black)](https://nextjs.org/)
[![Database: PostgreSQL 16 + Redis 7](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20Redis%207-red)](https://www.postgresql.org/)

An enterprise-grade, multi-agent AI decision-support system for agricultural management and precision irrigation advisory. Orchestrated via **LangGraph** using the **Hierarchical Supervisor Pattern with Parallel Fan-Out → Fan-In Architecture**, this platform provides actionable, explainable, and cost-controlled irrigation recommendations to farmers.

---

## 📋 Table of Contents
1. [Architectural Model Selection](#1-architectural-model-selection)
2. [Project Phases & Delivery Timeline](#2-project-phases--delivery-timeline)
3. [Technology Stack & Architectural Rationale](#3-technology-stack--architectural-rationale)
4. [LangGraph Multi-Agent Architecture](#4-langgraph-multi-agent-architecture)
5. [Data Ingestion & Telemetry Pipelines](#5-data-ingestion--telemetry-pipelines)
6. [Frontend Architecture & Farmer-First UX](#6-frontend-architecture--farmer-first-ux)
7. [Production Readiness & Safety Guardrails](#7-production-readiness--safety-guardrails)
8. [Mentorship & Best Practice Guidelines](#8-mentorship--best-practice-guidelines)
9. [Getting Started & Installation](#9-getting-started--installation)

---

## 1. Architectural Model Selection

For this system, we selected the **Hierarchical Supervisor Pattern with Parallel Fan-Out → Fan-In Graph Architecture** orchestrated using **LangGraph**.

### Why This Architecture?

| Architectural Pattern | How It Operates | Critical Flaws in Production | Verdict for This Project |
| :--- | :--- | :--- | :--- |
| **Hierarchical Supervisor with Parallel Fan-Out / Fan-In (LangGraph)** | A router fans out to specialized domain agents running concurrently. Outputs append to a typed state bus that converges into a Coordinator Node for conflict resolution. | Requires upfront state schema definition and reducer logic. *(Overhead is minimal and provides massive reliability benefits)*. | **SELECTED ARCHITECTURE** |

### Why This Model Fits Agronomic Decision-Support
* **Domain Orthogonality**: Weather forecast data, root-zone soil moisture metrics, and crop phenology stages do not depend on each other. Running them concurrently reduces end-to-end user latency from **~8 seconds to ~2 seconds** (max latency of individual agents).
* **Isolated Failure Domains**: If an upstream weather service degrades, the Soil and Crop Stage agents still execute successfully. The Coordinator receives a partial evidence packet with an explicit staleness flag rather than crashing the whole system.
* **Explainable Conflict Resolution**: In real agriculture, agents constantly disagree (e.g., Soil Agent wants water; Weather Agent sees imminent rain). A centralized Coordinator with explicit reconciliation rules guarantees that trade-offs are logged and explained transparently to the farmer.
* **Selective Model Tiering (Cost Control)**: We do not waste frontier LLM tokens on simple threshold comparisons. Soil and Crop Stage agents run as deterministic Python code ($0), while the Coordinator utilizes an LLM to synthesize natural language explanations.

---

## 2. Project Phases & Delivery Timeline

Deliverables are managed across three sequential phases under a strict 2-week deadline for Phase 1.

```
Phase 1: Core MVP (2 Weeks) ──► Phase 2: Upgrades (Post-Eval) ──► Phase 3: RAG Grounding & Final
```

### Phase 1: Core MVP System (2 Weeks Deadline)
* **Core Scope & Deliverables**:
  * **4 Core Backend Agents**: Weather Agent, Soil/Water Agent, Crop-Stage Agent, and Coordinator Agent orchestrated via LangGraph parallel branches.
  * **FastAPI Async REST Gateway**: High-throughput REST API with strict Pydantic validation.
  * **Local PostgreSQL 16 + Redis 7**: Persistence and background telemetry synchronization.
  * **Next.js Farmer Dashboard**: Live field metrics, visual decision hero card (`IRRIGATE` / `DELAY_IRRIGATION` / `DO_NOT_IRRIGATE`), explainability breakdown, and human-in-the-loop override buttons.
  * **Automated Golden Dataset Evaluation Harness**: 30 agricultural scenarios for regression testing.
* **Evaluation Milestone**: 1st Evaluation Meetup (Live system demonstration, UI walk-through, architecture review, latency/cost profiling, code review).

### Phase 2: Post-Evaluation Upgrade (Post Phase 1)
* **Core Scope & Deliverables**:
  * **Disease/Pest Vision Agent**: Open-access plant pathology image diagnostics.
  * **Market Agent**: Commodity pricing trends vs. harvest/spray timing.
  * **Next.js UX Upgrades**: Drag-and-drop leaf photo diagnostics, market commodity charts, and trade-off sensitivity toggles.
  * **Cache & Resilience**: Cache optimization and circuit-breaker implementation.
* **Evaluation Milestone**: Peer Code Review & Stress Testing (Multimodal pipeline verification, schema compatibility check, cache-hit analysis).

### Phase 3: Knowledge Grounding & Final Presentation (Final Milestone)
* **Core Scope & Deliverables**:
  * **Agronomy Literature RAG Knowledge Agent**: Vectorizing UN FAO-56 guidelines in `pgvector`.
  * **Resource & Water Constraint Agent**: Farm water reserve and irrigation equipment limits.
  * **Next.js RAG Citation Viewer**: Displays agronomy source literature for recommendations.
  * **Empirical Benchmarking**: Multi-agent graph vs. single-prompt LLM baseline performance study.
  * **Final Deliverables**: Architecture slide deck, deployment manual, and executive presentation.
* **Evaluation Milestone**: Final Stakeholder & Executive Presentation and project sign-off.

---

## 3. Technology Stack & Architectural Rationale

| Component | Technology Selected | How to Use It | Architectural & Cost Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend & UX** | Next.js 14+ (App Router, TypeScript, Tailwind CSS) | Build a responsive, mobile-first advisory dashboard. Server Components for data fetching; Client Components for interactive feedback and telemetry graphs. | Open-source React framework. Built-in API route handlers, optimized rendering, strict type-sharing with backend models, and zero hosting cost. |
| **API Gateway** | FastAPI (Async Python 3.11+) | Expose REST endpoints (`POST /api/v1/decisions/irrigate`). Enforce request validation with Pydantic models. Run via Uvicorn. | Free, open-source, high-throughput asynchronous execution, native OpenAPI docs. |
| **Agent Orchestrator** | LangGraph | Define an explicit `StateGraph` with parallel domain branches converging into a single synthesis coordinator node. | Free, open-source. Eliminates artificial serial latency through native concurrent fan-out/fan-in graph edges. |
| **Relational & Vector Store** | PostgreSQL 16 + pgvector | Store farm profiles, time-series cache records, decision logs, and document embeddings in vector columns. | 100% free open-source database running in local Docker. Eliminates paid cloud vector DBs. |
| **Cache & State Checkpoint** | Redis 7 | Cache regional weather/soil features by composite key (`telemetry:{lat}:{lon}`) with a 1-hour TTL. | Free local container. Prevents redundant API fetches and costly downstream agent re-evaluations. |
| **Background Scheduler** | Prefect (Local) or Celery Beat | Execute out-of-band scheduled workers to fetch fresh agricultural datasets into PostgreSQL and Redis. | Open-source workflow orchestration. Decouples external data extraction from user request paths. |
| **Observability & Tracing** | Langfuse (Self-Hosted) or LangSmith | Instrument all agent executions to log latency, tokens, prompt inputs, and reasoning outputs per request. | Free community tier / self-hosted Docker instance providing full request tracing and cost inspection. |

---

## 4. LangGraph Multi-Agent Architecture

```
                  ┌──────────────────────┐
                  │    START (Router)    │
                  └──────────┬───────────┘
                             │ Parallel Fan-Out
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Soil/Water  │     │   Weather    │     │  Crop Stage  │
│  Agent Node  │     │  Agent Node  │     │  Agent Node  │
└───────┬──────┘     └───────┬──────┘     └───────┬──────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │ Fan-In (operator.add)
                             ▼
                  ┌──────────────────────┐
                  │   Coordinator Node   │
                  │ (Conflict Resolver)  │
                  └──────────┬───────────┘
                             ▼
                            END
```

### Shared State Definition (`operator.add` Reducer)

```python
import operator
from typing import Annotated, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class AgentEvidence(BaseModel):
    agent_name: str
    claim: Literal["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION", "NEUTRAL"]
    recommended_volume_liters_sqm: Optional[float] = 0.0
    confidence_score: float = Field(ge=0.0, le=1.0)
    primary_evidence: str
    telemetry_timestamp: datetime
    data_freshness_seconds: int
    staleness_warning: bool

# The graph state uses Annotated with operator.add to append agent outputs in parallel
class OverallGraphState(BaseModel):
    user_query: str
    farm_id: str
    crop_type: str
    latitude: float
    longitude: float
    agent_outputs: Annotated[List[AgentEvidence], operator.add] = []
    conflict_detected: bool = False
    conflict_resolution_trace: Optional[str] = None
    final_decision: Optional[str] = None
    final_confidence: Optional[float] = None
```

### Graph Assembly & Compilation

```python
from langgraph.graph import StateGraph, START, END

def build_agricultural_graph():
    workflow = StateGraph(OverallGraphState)
    
    # Add nodes
    workflow.add_node("soil_agent", soil_water_agent_node)
    workflow.add_node("weather_agent", weather_agent_node)
    workflow.add_node("crop_agent", crop_stage_agent_node)
    workflow.add_node("coordinator", coordinator_node)
    
    # Parallel Fan-Out: START triggers all three agents simultaneously
    workflow.add_edge(START, "soil_agent")
    workflow.add_edge(START, "weather_agent")
    workflow.add_edge(START, "crop_agent")
    
    # Fan-In: All three agents direct into the Coordinator
    workflow.add_edge("soil_agent", "coordinator")
    workflow.add_edge("weather_agent", "coordinator")
    workflow.add_edge("crop_agent", "coordinator")
    
    workflow.add_edge("coordinator", END)
    
    return workflow.compile()
```

---

## 5. Data Ingestion & Telemetry Pipelines

### Verified Free Data Sources
* **Open-Meteo Weather & Soil API**: Multi-depth volumetric soil moisture (`soil_moisture_0_to_1cm`, `3_to_9cm`), precipitation probabilities, rain volume (mm), and FAO-56 reference evapotranspiration ($ET_0$). Free up to 10,000 calls/day with no API key required.
* **UN FAO-56 Agronomy Standards**: Public-domain benchmark tables containing Crop Coefficients ($K_c$), root depths, and maximum depletion fractions ($p$).
* **PlantVillage Dataset (Phase 2)**: 54,000+ labeled leaf images across 38 crop disease categories.
* **USDA AMS Feeds (Phase 2)**: Daily wholesale market settlement prices.

### Telemetry Freshness SLAs & Degradation Rules

| Domain Data | Max Allowed Staleness | Degradation & Fallback Action |
| :--- | :--- | :--- |
| **Weather Forecast & Rain %** | 1 Hour | If >1h, pull latest record from PostgreSQL; flag `staleness_warning: True`; deduct 0.30 from confidence score. Do not hallucinate forecasts. |
| **Root-Zone Soil Moisture** | 24 Hours | If cache misses, calculate soil water depletion using prior cumulative $ET_0$ and rainfall balance model. |
| **Crop Growth Phenology** | 7 Days | Recompute stage using planting date and accumulated GDD (Growing Degree Days) lookup tables. |

---

## 6. Frontend Architecture & Farmer-First UX

Designed for high contrast and rapid readability in direct sunlight across 4 visual tiers:

* 🟢 **Tier 1: Immediate Action (Decision Hero Card)**: Large color-coded card (Emerald for `IRRIGATE`, Amber for `DELAY_IRRIGATION`, Slate for `DO_NOT_IRRIGATE`), recommended volume ($L/m^2$), and overall confidence percentage.
* 🔍 **Tier 2: The "Why" (Conflict Trace Accordion)**: Transparently displays Coordinator reconciliation logic in natural language.
* 📊 **Tier 3: Domain Evidence Grid**: 3 compact cards breaking down raw telemetry and claims from Weather, Soil Moisture, and Crop Phenology agents.
* ✍️ **Tier 4: Feedback Override Bar**: `[Accept Recommendation]` and `[Override]` buttons logging farmer actions and rationale directly to PostgreSQL for evaluation dataset expansion.

---

## 7. Production Readiness & Safety Guardrails

1. **Absolute Safety Gate (Zero Autonomous Actuation)**: The system is strictly an advisory decision-support tool. It must **never** directly actuate physical IoT irrigation valves or chemical spray hardware. Every output is an actionable recommendation for human confirmation.
2. **Human-in-the-Loop Feedback**: Disagreements capture farmer rationale and log directly to PostgreSQL for evaluation dataset expansion.
3. **Idempotency Keys**: Every decision request includes a client-generated `request_id` to return cached graph state within 15 minutes.
4. **Golden Dataset Benchmark**: 30 agricultural edge-case scenarios tested automatically before code freeze to prevent regression bugs.

---

## 8. Mentorship & Best Practice Guidelines

* **Master the State Reducer Pattern**: Annotate shared parallel keys with reducers like `operator.add`. Treat graph state as an immutable event stream.
* **Keep Contracts Synchronized**: Keep Next.js TypeScript interfaces (`lib/types.ts`) synchronized with backend Pydantic models.
* **Mock External Endpoints in Tests**: Never make live network calls during automated test runs. Use `pytest-mock` or `respx`.
* **Fail Gracefully**: If an upstream source fails, return claim `"NEUTRAL"` with `confidence_score: 0.0` and `staleness_warning: True`. Never crash unhandled.
* **Git Branch Hygiene**: Keep PRs focused (<300 lines) and scoped to individual features backed by unit tests.

---

## 9. Getting Started & Installation

### Prerequisites
* Python 3.11+
* Node.js 18+
* Docker Desktop (for PostgreSQL & Redis)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Thusharkanth/agri-supervisor-orchestrator.git
cd agri-supervisor-orchestrator

# Setup Backend
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate
pip install -r requirements.txt
python run.py

# Setup Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

---

*Developed for the Multi-Agent Agricultural Decision-Support Project.*

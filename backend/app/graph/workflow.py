"""
LangGraph Workflow — Parallel Fan-Out → Fan-In
----------------------------------------------
Assembles and compiles the StateGraph that orchestrates all 4 agent nodes.
"""
from langgraph.graph import StateGraph, START, END
from app.graph.state import OverallGraphState
from app.graph.nodes.soil_agent import soil_water_agent_node
from app.graph.nodes.weather_agent import weather_agent_node
from app.graph.nodes.crop_agent import crop_stage_agent_node
from app.graph.nodes.coordinator import coordinator_node


def build_agricultural_graph():
    """
    Build and compile the LangGraph StateGraph.

    Graph topology:
        START
          ├──► soil_agent   ──┐
          ├──► weather_agent ──┼──► coordinator ──► END
          └──► crop_agent   ──┘

    The 3 domain agents run IN PARALLEL (fan-out).
    Their outputs are merged by operator.add into agent_outputs list (fan-in).
    The coordinator then reads all outputs and makes the final decision.
    """
    workflow = StateGraph(OverallGraphState)

    # ── Register all agent nodes ───────────────────────────────────────────────
    workflow.add_node("soil_agent", soil_water_agent_node)
    workflow.add_node("weather_agent", weather_agent_node)
    workflow.add_node("crop_agent", crop_stage_agent_node)
    workflow.add_node("coordinator", coordinator_node)

    # ── Parallel Fan-Out: START triggers all 3 agents simultaneously ───────────
    workflow.add_edge(START, "soil_agent")
    workflow.add_edge(START, "weather_agent")
    workflow.add_edge(START, "crop_agent")

    # ── Fan-In: All 3 agents send their output to the Coordinator ─────────────
    workflow.add_edge("soil_agent", "coordinator")
    workflow.add_edge("weather_agent", "coordinator")
    workflow.add_edge("crop_agent", "coordinator")

    # ── Coordinator outputs the final decision ─────────────────────────────────
    workflow.add_edge("coordinator", END)

    return workflow.compile()


# Compile once at import time (reused across all API requests)
agri_graph = build_agricultural_graph()

"""
Full system verification script — checks every component before Day 4.
Run: python verify_setup.py
"""
import asyncio
import sys
import importlib

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[WARN]"

results = []


def check(label, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((status, label, detail))
    print(f"  {status}  {label}" + (f" — {detail}" if detail else ""))


# ── 1. Python version ──────────────────────────────────────────────────────────
print("\n=== 1. Python Environment ===")
import sys
ver = sys.version_info
check("Python version", ver >= (3, 11), f"{ver.major}.{ver.minor}.{ver.micro}")

# ── 2. All required packages importable ───────────────────────────────────────
print("\n=== 2. Package Imports ===")
packages = [
    ("fastapi", "FastAPI"),
    ("uvicorn", "Uvicorn"),
    ("langgraph", "LangGraph"),
    ("langchain_core", "LangChain Core"),
    ("langchain_ollama", "LangChain Ollama"),
    ("pydantic", "Pydantic"),
    ("pydantic_settings", "Pydantic Settings"),
    ("httpx", "HTTPX"),
    ("sqlalchemy", "SQLAlchemy"),
    ("asyncpg", "AsyncPG"),
    ("alembic", "Alembic"),
    ("redis", "Redis"),
    ("pytest", "Pytest"),
]
for pkg, name in packages:
    try:
        importlib.import_module(pkg)
        check(f"{name} importable", True)
    except ImportError as e:
        check(f"{name} importable", False, str(e))

# ── 3. App modules importable ─────────────────────────────────────────────────
print("\n=== 3. App Module Imports ===")
app_modules = [
    ("app.core.config", "Config / Settings"),
    ("app.graph.state", "Graph State (AgentEvidence, OverallGraphState)"),
    ("app.graph.nodes.soil_agent", "Soil Agent Node"),
    ("app.graph.nodes.weather_agent", "Weather Agent Node"),
    ("app.graph.nodes.crop_agent", "Crop Stage Agent Node"),
    ("app.graph.nodes.coordinator", "Coordinator Node"),
    ("app.graph.workflow", "LangGraph Workflow"),
    ("app.main", "FastAPI App"),
]
for mod, name in app_modules:
    try:
        importlib.import_module(mod)
        check(f"{name}", True)
    except Exception as e:
        check(f"{name}", False, str(e))

# ── 4. LangGraph graph compiles & runs ────────────────────────────────────────
print("\n=== 4. LangGraph Graph Smoke Test ===")
async def run_graph():
    from app.graph.workflow import agri_graph
    from app.graph.state import OverallGraphState
    state = OverallGraphState(
        farm_id="VERIFY-001",
        crop_type="Maize",
        latitude=7.8731,
        longitude=80.7718,
        planting_date="2026-07-01",
    )
    result = await agri_graph.ainvoke(state.model_dump())
    assert result["final_decision"] in ["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION"]
    assert len(result["agent_outputs"]) == 3
    assert result["final_confidence"] is not None
    return result

try:
    result = asyncio.run(run_graph())
    check("Graph compiles and runs", True)
    check("3 agent outputs collected", len(result["agent_outputs"]) == 3, f"Got {len(result['agent_outputs'])}")
    check("Final decision is valid", result["final_decision"] in ["IRRIGATE","DO_NOT_IRRIGATE","DELAY_IRRIGATION"], result["final_decision"])
    check("Confidence score set", result["final_confidence"] is not None, f"{result['final_confidence']:.0%}")
    check("Conflict trace set", bool(result["conflict_resolution_trace"]))
except Exception as e:
    check("LangGraph graph execution", False, str(e))

# ── 5. Redis connection ────────────────────────────────────────────────────────
print("\n=== 5. Redis Connection ===")
async def check_redis():
    import redis.asyncio as aioredis
    r = aioredis.Redis(host="localhost", port=6379, decode_responses=True)
    pong = await r.ping()
    await r.set("agri:verify", "ok", ex=10)
    val = await r.get("agri:verify")
    await r.aclose()
    return pong, val

try:
    pong, val = asyncio.run(check_redis())
    check("Redis ping", pong is True, "PONG received")
    check("Redis set/get", val == "ok", f"Got: {val}")
except Exception as e:
    check("Redis connection", False, str(e))

# ── 6. PostgreSQL connection ───────────────────────────────────────────────────
print("\n=== 6. PostgreSQL Connection ===")
async def check_postgres():
    import asyncpg
    conn = await asyncpg.connect(
        host="localhost", port=6543,
        user="agri_user", password="agri_pass", database="agri_db"
    )
    version = await conn.fetchval("SELECT version()")
    await conn.close()
    return version

try:
    pg_version = asyncio.run(check_postgres())
    check("PostgreSQL connection", True, pg_version.split(",")[0])
except Exception as e:
    check("PostgreSQL connection", False, str(e))

# ── 7. Ollama reachable ────────────────────────────────────────────────────────
print("\n=== 7. Ollama Availability ===")
async def check_ollama():
    import httpx
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get("http://localhost:11434/api/tags")
        return resp.status_code, resp.json()

try:
    status, data = asyncio.run(check_ollama())
    models = [m["name"] for m in data.get("models", [])]
    check("Ollama reachable", status == 200, f"HTTP {status}")
    check("Models available", len(models) > 0, f"Found: {', '.join(models[:3]) if models else 'none'}")
except Exception as e:
    check("Ollama reachable", False, str(e))
    print(f"         {WARN} Ollama not running — start it with: ollama serve")

# ── 8. Open-Meteo API reachable ───────────────────────────────────────────────
print("\n=== 8. Open-Meteo API ===")
async def check_open_meteo():
    import httpx
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 7.8731, "longitude": 80.7718,
        "hourly": "precipitation_probability",
        "forecast_days": 1,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        return resp.status_code, resp.json()

try:
    status, data = asyncio.run(check_open_meteo())
    check("Open-Meteo reachable", status == 200, f"HTTP {status}")
    check("Response has hourly data", "hourly" in data, f"Keys: {list(data.keys())}")
except Exception as e:
    check("Open-Meteo reachable", False, str(e))

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  VERIFICATION SUMMARY")
print("=" * 60)
passed = sum(1 for r in results if r[0] == PASS)
failed = sum(1 for r in results if r[0] == FAIL)
print(f"\n  {PASS} Passed : {passed}")
print(f"  {FAIL} Failed : {failed}")
if failed == 0:
    print("\n  ALL CHECKS PASSED — Ready for Day 4!")
else:
    print("\n  FAILED CHECKS — Fix these before proceeding:")
    for r in results:
        if r[0] == FAIL:
            print(f"    - {r[1]}: {r[2]}")
print()

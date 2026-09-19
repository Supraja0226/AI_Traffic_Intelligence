import os
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.data_analysis_agent import DataAnalysisAgent
from app.agents.congestion_detection_agent import CongestionDetectionAgent
from app.agents.incident_analysis_agent import IncidentAnalysisAgent
from app.agents.forecasting_agent import ForecastingAgent
from app.agents.advisory_agent import AdvisoryAgent
from app.agents.network_optimization_agent import NetworkOptimizationAgent
from app.agents.monitoring_agent import MonitoringAgent
from models.traffic_metrics import TrafficPhysics
from preprocessing.network_graph import RoadNetworkGraph

app = FastAPI(
    title="AI Traffic Intelligence & Road Network Optimization ML Service",
    version="1.0.0",
    description="Discrete composable agent pipeline for traffic intelligence, congestion, incidents, forecasting, and simulation"
)

# Enable CORS for Next.js frontend and Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PipelineRequest(BaseModel):
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    raw_data: Optional[Any] = None
    dataset_name: Optional[str] = "Uploaded Dataset"

class DiversionSimulationRequest(BaseModel):
    congested_edge_id: str
    diversion_pct: float = 15.0
    network_state: List[Dict[str, Any]]
    alternate_edge_ids: Optional[List[str]] = None

class NetworkModificationRequest(BaseModel):
    target_edge_id: str
    lanes_to_add: int = 1
    network_state: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "AI Traffic Intelligence ML Service",
        "timestamp": time.time(),
        "agents_available": [
            "Data Analysis Agent",
            "Congestion Detection Agent",
            "Incident Analysis Agent",
            "Forecasting Agent",
            "Advisory Agent",
            "Network Optimization Agent",
            "Monitoring Agent"
        ]
    }

@app.post("/api/agents/pipeline")
def execute_pipeline(req: PipelineRequest):
    """Executes the 11-step traffic intelligence pipeline across all 7 discrete agents."""
    pipeline_start = time.time()
    state: Dict[str, Any] = {
        "file_path": req.file_path,
        "file_type": req.file_type,
        "raw_data": req.raw_data,
        "dataset_name": req.dataset_name,
        "agent_results": []
    }

    # Instantiate agents
    agent1 = DataAnalysisAgent()
    agent2 = CongestionDetectionAgent()
    agent3 = IncidentAnalysisAgent()
    agent4 = ForecastingAgent()
    agent5 = AdvisoryAgent()
    agent6 = NetworkOptimizationAgent()
    agent7 = MonitoringAgent()

    # STEP 1, 2, 3: Data Analysis Agent
    res1 = agent1.execute(state)
    state["agent_results"].append(res1)
    if res1["status"] != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Data Analysis Agent failed: {res1.get('error')}")
    state.update(res1["data"])

    # STEP 4: Congestion Detection Agent
    res2 = agent2.execute(state)
    state["agent_results"].append(res2)
    state.update(res2["data"])

    # STEP 5: Incident Analysis Agent (Strict evidence based)
    res3 = agent3.execute(state)
    state["agent_results"].append(res3)
    state.update(res3["data"])

    # STEP 6: Forecasting Agent (15-60 min multi-horizon)
    res4 = agent4.execute(state)
    state["agent_results"].append(res4)
    state.update(res4["data"])

    # STEP 7, 8: Advisory Agent
    res5 = agent5.execute(state)
    state["agent_results"].append(res5)
    state.update(res5["data"])

    # STEP 9, 10: Network Optimization Agent
    res6 = agent6.execute(state)
    state["agent_results"].append(res6)
    state.update(res6["data"])

    # STEP 11: Monitoring Agent & Final Synthesis
    state["pipeline_duration_ms"] = round((time.time() - pipeline_start) * 1000, 2)
    res7 = agent7.execute(state)
    state["agent_results"].append(res7)
    state.update(res7["data"])

    return {
        "status": "SUCCESS",
        "total_duration_ms": state["pipeline_duration_ms"],
        "dataset_name": req.dataset_name,
        "validation_report": state.get("validation_report"),
        "network_summary": state.get("network_summary"),
        "topology_summary": state.get("topology_summary"),
        "current_network_state": state.get("current_network_state"),
        "classified_edges": state.get("classified_edges"),
        "congestion_summary": state.get("summary"),
        "confirmed_incidents": state.get("confirmed_incidents"),
        "unconfirmed_anomalies": state.get("unconfirmed_anomalies"),
        "forecasts_by_edge": state.get("forecasts_by_edge"),
        "advisories": state.get("advisories"),
        "optimization_recommendations": state.get("recommendations"),
        "agent_execution_timeline": state.get("agent_results")
    }

@app.post("/api/simulations/diversion")
def simulate_diversion(req: DiversionSimulationRequest):
    """Simulates shifting a percentage of flow from a congested link to alternative paths using BPR physics."""
    edge_map = {e["edge_id"]: e for e in req.network_state}
    congested_edge = edge_map.get(req.congested_edge_id)

    if not congested_edge:
        raise HTTPException(status_code=404, detail=f"Edge '{req.congested_edge_id}' not found in network state.")

    # Find alternate route using graph engine if not explicitly supplied
    import pandas as pd
    df = pd.DataFrame(req.network_state)
    graph_engine = RoadNetworkGraph()
    graph_engine.build_from_dataframe(df)

    src = str(congested_edge.get("source_node", ""))
    dst = str(congested_edge.get("target_node", ""))
    alt_paths = graph_engine.find_alternate_paths(src, dst, exclude_edge_id=req.congested_edge_id)

    # Determine alternate edges to absorb diverted flow
    alt_edge_ids = req.alternate_edge_ids or []
    if not alt_edge_ids and alt_paths:
        alt_edge_ids = [edge["edge_id"] for edge in alt_paths[0]["edges"]]

    if not alt_edge_ids:
        # Fallback to any other edge if graph path not connected
        other_edges = [e["edge_id"] for e in req.network_state if e["edge_id"] != req.congested_edge_id]
        alt_edge_ids = other_edges[:2] if other_edges else []

    # Calculate baseline parameters on congested corridor
    curr_vol = float(congested_edge.get("volume_veh_hr", 3000.0))
    cap = float(congested_edge.get("capacity_veh_hr", 3000.0))
    ffs = float(congested_edge.get("free_flow_speed_kmh", 60.0))
    curr_spd = float(congested_edge.get("avg_speed_kmh", 20.0))
    curr_tt = float(congested_edge.get("travel_time_sec", 180.0))
    curr_vc = round(curr_vol / max(cap, 1.0), 3)

    # Calculate diverted volume
    div_pct = min(50.0, max(1.0, req.diversion_pct))
    diverted_vol = curr_vol * (div_pct / 100.0)
    new_vol = curr_vol - diverted_vol

    # Recalculate congested corridor under reduced volume
    t0 = max(10.0, curr_tt / max((1.0 + 0.15 * (curr_vc ** 4.0)), 0.1))
    sim_tt = TrafficPhysics.calculate_bpr_travel_time(t0, new_vol, cap)
    sim_spd = TrafficPhysics.calculate_speed_from_bpr(ffs, new_vol, cap)
    sim_vc = round(new_vol / max(cap, 1.0), 3)

    # Distribute diverted volume across alternate links
    alt_simulations = []
    vol_per_alt = diverted_vol / max(len(alt_edge_ids), 1)

    for aid in alt_edge_ids:
        alt_edge = edge_map.get(aid)
        if alt_edge:
            a_vol = float(alt_edge.get("volume_veh_hr", 1500.0))
            a_cap = float(alt_edge.get("capacity_veh_hr", 2500.0))
            a_ffs = float(alt_edge.get("free_flow_speed_kmh", 60.0))
            a_spd = float(alt_edge.get("avg_speed_kmh", 55.0))
            a_tt = float(alt_edge.get("travel_time_sec", 120.0))
            a_curr_vc = round(a_vol / max(a_cap, 1.0), 3)

            a_new_vol = a_vol + vol_per_alt
            a_t0 = max(10.0, a_tt / max((1.0 + 0.15 * (a_curr_vc ** 4.0)), 0.1))
            a_sim_tt = TrafficPhysics.calculate_bpr_travel_time(a_t0, a_new_vol, a_cap)
            a_sim_spd = TrafficPhysics.calculate_speed_from_bpr(a_ffs, a_new_vol, a_cap)
            a_sim_vc = round(a_new_vol / max(a_cap, 1.0), 3)

            alt_simulations.append({
                "edge_id": aid,
                "road_name": alt_edge.get("road_name"),
                "volume_added_veh_hr": round(vol_per_alt, 1),
                "before": {"volume": a_vol, "avg_speed_kmh": a_spd, "travel_time_sec": a_tt, "vc_ratio": a_curr_vc},
                "after": {"volume": round(a_new_vol, 1), "avg_speed_kmh": a_sim_spd, "travel_time_sec": a_sim_tt, "vc_ratio": a_sim_vc},
                "speed_impact_kmh": round(a_sim_spd - a_spd, 1)
            })

    return {
        "status": "SIMULATION_SUCCESS",
        "simulation_type": "CORRIDOR_DIVERSION",
        "diversion_percentage": div_pct,
        "diverted_volume_veh_hr": round(diverted_vol, 1),
        "primary_corridor": {
            "edge_id": req.congested_edge_id,
            "road_name": congested_edge.get("road_name"),
            "before": {"volume": curr_vol, "avg_speed_kmh": curr_spd, "travel_time_sec": curr_tt, "vc_ratio": curr_vc},
            "after": {"volume": round(new_vol, 1), "avg_speed_kmh": sim_spd, "travel_time_sec": sim_tt, "vc_ratio": sim_vc},
            "net_travel_time_saved_sec": round(curr_tt - sim_tt, 1),
            "net_speed_gain_kmh": round(sim_spd - curr_spd, 1)
        },
        "alternate_corridors": alt_simulations,
        "assumptions": [
            "Advisory simulation only. No live municipal traffic controls or signs altered.",
            "BPR volume-delay equation evaluated with alpha=0.15, beta=4.0.",
            "Traffic demand assumed constant during diversion assessment window."
        ]
    }

@app.post("/api/simulations/modification")
def simulate_network_modification(req: NetworkModificationRequest):
    """Simulates adding lanes to a road edge and recalculates structural performance."""
    edge_map = {e["edge_id"]: e for e in req.network_state}
    target_edge = edge_map.get(req.target_edge_id)

    if not target_edge:
        raise HTTPException(status_code=404, detail=f"Edge '{req.target_edge_id}' not found.")

    res = NetworkOptimizationAgent.simulate_lane_addition(target_edge, lanes_to_add=req.lanes_to_add)
    return {
        "status": "SIMULATION_SUCCESS",
        "simulation": res
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

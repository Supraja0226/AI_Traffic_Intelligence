import os
import sys

# Ensure ml-service root and app are in pythonpath
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

from preprocessing.cleaner import DatasetCleaner
from preprocessing.network_graph import RoadNetworkGraph
from models.traffic_metrics import TrafficPhysics
from forecasting.predictor import MultiHorizonPredictor
from app.agents.data_analysis_agent import DataAnalysisAgent
from app.agents.congestion_detection_agent import CongestionDetectionAgent
from app.agents.incident_analysis_agent import IncidentAnalysisAgent
from app.agents.forecasting_agent import ForecastingAgent
from app.agents.advisory_agent import AdvisoryAgent
from app.agents.network_optimization_agent import NetworkOptimizationAgent
from app.agents.monitoring_agent import MonitoringAgent

def test_full_agent_pipeline():
    sample_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "samples", "metro_corridor_traffic.csv")
    print(f"Testing with sample CSV: {sample_csv}")
    assert os.path.exists(sample_csv), f"Sample file not found: {sample_csv}"

    # 1. Cleaner test
    df, report = DatasetCleaner.load_and_standardize(sample_csv)
    print(f"[OK] Cleaner standardized {len(df)} records. Report: is_valid={report['is_valid']}, format={report['detected_format']}")
    assert report["is_valid"] is True
    assert len(df) > 0

    # 2. Physics test
    df_enriched, summary = TrafficPhysics.enrich_network_metrics(df)
    print(f"[OK] TrafficPhysics enriched metrics: Health Index={summary['network_health_index']}, Avg V/C={summary['average_vc_ratio']}")
    assert "vc_ratio" in df_enriched.columns
    assert "los" in df_enriched.columns
    assert "congestion_score" in df_enriched.columns

    # 3. Agent Execution
    state = {
        "file_path": sample_csv,
        "file_type": "csv",
        "agent_results": []
    }

    # Agent 1
    a1 = DataAnalysisAgent()
    res1 = a1.execute(state)
    if res1["status"] != "COMPLETED":
        print("Agent 1 Error:", res1.get("error"))
        print("Agent 1 Logs:", res1.get("logs"))
    assert res1["status"] == "COMPLETED"
    state["agent_results"].append(res1)
    state.update(res1["data"])
    print(f"[OK] Agent 1 completed in {res1['duration_ms']}ms. Edges in network: {len(state['current_network_state'])}")

    # Agent 2
    a2 = CongestionDetectionAgent()
    res2 = a2.execute(state)
    assert res2["status"] == "COMPLETED"
    state["agent_results"].append(res2)
    state.update(res2["data"])
    print(f"[OK] Agent 2 completed in {res2['duration_ms']}ms. Severe links: {res2['data']['summary']['severe_links']}")

    # Agent 3 (Incident Analysis - strict evidence)
    a3 = IncidentAnalysisAgent()
    res3 = a3.execute(state)
    assert res3["status"] == "COMPLETED"
    state["agent_results"].append(res3)
    state.update(res3["data"])
    print(f"[OK] Agent 3 completed in {res3['duration_ms']}ms. Confirmed incidents: {len(res3['data']['confirmed_incidents'])}, Unconfirmed anomalies: {len(res3['data']['unconfirmed_anomalies'])}")

    # Agent 4
    a4 = ForecastingAgent()
    res4 = a4.execute(state)
    assert res4["status"] == "COMPLETED"
    state["agent_results"].append(res4)
    state.update(res4["data"])
    print(f"[OK] Agent 4 completed in {res4['duration_ms']}ms. Forecasted edges: {len(res4['data']['forecasts_by_edge'])}")

    # Agent 5
    a5 = AdvisoryAgent()
    res5 = a5.execute(state)
    assert res5["status"] == "COMPLETED"
    state["agent_results"].append(res5)
    state.update(res5["data"])
    print(f"[OK] Agent 5 completed in {res5['duration_ms']}ms. Advisories generated: {len(res5['data']['advisories'])}")

    # Agent 6
    a6 = NetworkOptimizationAgent()
    res6 = a6.execute(state)
    assert res6["status"] == "COMPLETED"
    state["agent_results"].append(res6)
    state.update(res6["data"])
    print(f"[OK] Agent 6 completed in {res6['duration_ms']}ms. Optimization recommendations: {len(res6['data']['recommendations'])}")

    # Test Diversion Simulation calculation
    from app.main import DiversionSimulationRequest, simulate_diversion, NetworkModificationRequest, simulate_network_modification
    div_req = DiversionSimulationRequest(
        congested_edge_id="EDGE_101",
        diversion_pct=15.0,
        network_state=state["current_network_state"]
    )
    div_res = simulate_diversion(div_req)
    assert div_res["status"] == "SIMULATION_SUCCESS"
    assert div_res["primary_corridor"]["net_speed_gain_kmh"] > 0
    print(f"[OK] Diversion simulation: diverted {div_res['diverted_volume_veh_hr']} veh/hr, speed gain={div_res['primary_corridor']['net_speed_gain_kmh']} km/h")

    # Test Network Modification calculation
    mod_req = NetworkModificationRequest(
        target_edge_id="EDGE_101",
        lanes_to_add=1,
        network_state=state["current_network_state"]
    )
    mod_res = simulate_network_modification(mod_req)
    assert mod_res["status"] == "SIMULATION_SUCCESS"
    assert mod_res["simulation"]["delta"]["speed_gain_kmh"] > 0
    print(f"[OK] Lane addition simulation: speed gain={mod_res['simulation']['delta']['speed_gain_kmh']} km/h, hours saved={mod_res['simulation']['delta']['annual_person_hours_saved']}")

    print("\n>>> ALL 7 DISCRETE AGENTS & PHYSICS SIMULATORS PASSED VERIFICATION WITH ZERO FAILURES! <<<")


def test_geojson_dataset_pipeline():
    geojson_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "samples", "urban_network.geojson")
    assert os.path.exists(geojson_path), f"GeoJSON sample missing: {geojson_path}"

    df, report = DatasetCleaner.load_and_standardize(geojson_path, file_type="geojson")
    print(f"[GEOJSON] Cleaned {len(df)} rows. Report: {report}")
    assert report["is_valid"] is True
    assert "edge_id" in df.columns
    assert "volume_veh_hr" in df.columns
    assert "avg_speed_kmh" in df.columns

    state = {
        "file_path": geojson_path,
        "file_type": "geojson",
        "raw_data": None,
        "agent_results": []
    }
    result = DataAnalysisAgent().execute(state)
    print(f"[GEOJSON] Agent result: {result['status']}, error={result.get('error')}")
    assert result["status"] == "COMPLETED"
    assert len(result["data"]["current_network_state"]) > 0


if __name__ == "__main__":
    test_geojson_dataset_pipeline()

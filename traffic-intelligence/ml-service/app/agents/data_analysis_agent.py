import pandas as pd
from typing import Dict, Any
from app.agents.base_agent import BaseTrafficAgent
from preprocessing.cleaner import DatasetCleaner
from preprocessing.network_graph import RoadNetworkGraph
from models.traffic_metrics import TrafficPhysics

class DataAnalysisAgent(BaseTrafficAgent):
    """Agent 1: Validates datasets, cleans records, calculates traffic metrics, builds current network state."""

    def __init__(self):
        super().__init__(
            agent_id="AGENT_01_DATA_ANALYSIS",
            name="Data Analysis Agent",
            role="Validates and cleans input datasets, establishes road network topology, and computes fundamental traffic metrics"
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        raw_data = state.get("raw_data")
        file_path = state.get("file_path")
        file_type = state.get("file_type")

        self.log("Step 1/3: Ingesting and standardizing dataset...")
        source = file_path if file_path else raw_data
        df, validation_report = DatasetCleaner.load_and_standardize(source, file_type=file_type)

        if not validation_report["is_valid"]:
            self.log(f"Validation failed with errors: {validation_report['errors']}")
            raise ValueError(f"Dataset invalid: {', '.join(validation_report['errors'])}")

        self.log(f"Step 2/3: Enriched {len(df)} records. Applying BPR physics and HCM LOS classification...")
        df_enriched, network_summary = TrafficPhysics.enrich_network_metrics(df)

        self.log("Step 3/3: Constructing NetworkX topological graph...")
        graph_engine = RoadNetworkGraph()
        graph_engine.build_from_dataframe(df_enriched)
        topology_summary = graph_engine.get_network_topology_summary()

        # Isolate the latest state snapshot per unique edge
        latest_df = df_enriched.sort_values(by="timestamp" if "timestamp" in df_enriched.columns else "edge_id").groupby("edge_id").last().reset_index()

        self.record_evidence(
            title="Dataset Topology and Health Baseline",
            metrics={
                "total_records": len(df_enriched),
                "unique_edges": len(latest_df),
                "network_health_index": network_summary["network_health_index"],
                "average_vc_ratio": network_summary["average_vc_ratio"],
                "average_speed_kmh": network_summary["average_speed_kmh"],
                "graph_density": topology_summary["density"]
            },
            rationale="Baseline metrics established using Highway Capacity Manual LOS and Bureau of Public Roads delay formulation."
        )

        return {
            "validation_report": validation_report,
            "network_summary": network_summary,
            "topology_summary": topology_summary,
            "current_network_state": latest_df.to_dict(orient="records"),
            "full_dataset_records": df_enriched.to_dict(orient="records")
        }

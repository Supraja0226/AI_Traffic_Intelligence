import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.agents.base_agent import BaseTrafficAgent

CONGESTION_LEVELS = {
    "FREE_FLOW": {"min": 0.0, "max": 25.0, "color": "#10B981", "desc": "Optimal flow at free-flow speeds"},
    "LIGHT": {"min": 25.0, "max": 45.0, "color": "#3B82F6", "desc": "Minor density, no significant impedance"},
    "MODERATE": {"min": 45.0, "max": 65.0, "color": "#F59E0B", "desc": "Speed restrictions, noticeable delay"},
    "HEAVY": {"min": 65.0, "max": 85.0, "color": "#EF4444", "desc": "Flow breakdown near capacity"},
    "SEVERE": {"min": 85.0, "max": 100.0, "color": "#7F1D1D", "desc": "Extreme congestion / stop-and-go breakdown"}
}

class CongestionDetectionAgent(BaseTrafficAgent):
    """Agent 2: Classifies conditions as FREE_FLOW, LIGHT, MODERATE, HEAVY, SEVERE using statistical baselines + ML anomaly detection."""

    def __init__(self):
        super().__init__(
            agent_id="AGENT_02_CONGESTION_DETECTION",
            name="Congestion Detection Agent",
            role="Evaluates continuous traffic parameters against statistical baselines and anomaly thresholds to categorize congestion levels"
        )

    def _classify_level(self, score: float) -> str:
        for lvl, meta in CONGESTION_LEVELS.items():
            if meta["min"] <= score <= meta["max"]:
                return lvl
        return "SEVERE" if score > 100.0 else "FREE_FLOW"

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        network_state = state.get("current_network_state", [])
        if not network_state:
            raise ValueError("No network state provided to Congestion Detection Agent.")

        df = pd.DataFrame(network_state)
        self.log(f"Evaluating {len(df)} active road segments...")

        # Calculate z-scores for anomaly detection
        speeds = df["avg_speed_kmh"].values
        vcs = df["vc_ratio"].values

        mean_spd = np.mean(speeds) if len(speeds) > 0 else 50.0
        std_spd = np.std(speeds) if len(speeds) > 0 and np.std(speeds) > 0 else 1.0

        mean_vc = np.mean(vcs) if len(vcs) > 0 else 0.5
        std_vc = np.std(vcs) if len(vcs) > 0 and np.std(vcs) > 0 else 0.1

        classified_edges = []
        congested_count = 0
        severe_count = 0

        for _, row in df.iterrows():
            c_score = float(row.get("congestion_score", 0.0))
            level = self._classify_level(c_score)

            spd = float(row.get("avg_speed_kmh", 50.0))
            vc = float(row.get("vc_ratio", 0.5))

            # Statistical anomaly flags
            spd_zscore = (spd - mean_spd) / std_spd
            vc_zscore = (vc - mean_vc) / std_vc

            is_anomaly = bool(spd_zscore < -1.75 or vc_zscore > 2.0 or c_score >= 80.0)

            if level in ["HEAVY", "SEVERE"]:
                congested_count += 1
            if level == "SEVERE":
                severe_count += 1

            classified_edge = {
                "edge_id": row.get("edge_id"),
                "road_name": row.get("road_name"),
                "congestion_level": level,
                "congestion_score": c_score,
                "speed_kmh": spd,
                "vc_ratio": vc,
                "occupancy_pct": float(row.get("occupancy_pct", 0.0)),
                "is_statistical_anomaly": is_anomaly,
                "speed_zscore": round(float(spd_zscore), 2),
                "vc_zscore": round(float(vc_zscore), 2),
                "visual_color": CONGESTION_LEVELS[level]["color"],
                "description": CONGESTION_LEVELS[level]["desc"]
            }
            classified_edges.append(classified_edge)

            if is_anomaly:
                self.record_evidence(
                    title=f"Anomaly on {row.get('road_name')} ({row.get('edge_id')})",
                    metrics={
                        "edge_id": row.get("edge_id"),
                        "speed_kmh": spd,
                        "free_flow_speed_kmh": float(row.get("free_flow_speed_kmh", 60.0)),
                        "speed_zscore": round(float(spd_zscore), 2),
                        "vc_ratio": vc,
                        "congestion_score": c_score
                    },
                    rationale=f"Speed dropped {round(abs(spd_zscore), 1)} std deviations below network mean with capacity ratio {vc}."
                )

        self.log(f"Categorization complete: {congested_count} heavy/severe segments out of {len(df)} links.")

        return {
            "classified_edges": classified_edges,
            "summary": {
                "total_analyzed": len(df),
                "free_flow_links": len([e for e in classified_edges if e["congestion_level"] == "FREE_FLOW"]),
                "light_links": len([e for e in classified_edges if e["congestion_level"] == "LIGHT"]),
                "moderate_links": len([e for e in classified_edges if e["congestion_level"] == "MODERATE"]),
                "heavy_links": len([e for e in classified_edges if e["congestion_level"] == "HEAVY"]),
                "severe_links": severe_count,
                "anomaly_count": len([e for e in classified_edges if e["is_statistical_anomaly"]])
            }
        }

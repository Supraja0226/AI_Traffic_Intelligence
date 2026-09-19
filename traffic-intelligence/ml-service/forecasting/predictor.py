import numpy as np
import pandas as pd
from typing import Dict, List, Any
from models.traffic_metrics import TrafficPhysics

HORIZONS_MIN = [15, 30, 45, 60]

class MultiHorizonPredictor:
    """Multi-horizon time-series forecasting service for traffic volume, speed, and congestion state."""

    @staticmethod
    def forecast_edge_state(edge_history: pd.DataFrame, current_row: pd.Series) -> List[Dict[str, Any]]:
        """Forecasts traffic states across 15, 30, 45, 60 minute horizons with confidence bands."""
        current_volume = float(current_row.get("volume_veh_hr", 2000.0))
        current_speed = float(current_row.get("avg_speed_kmh", 60.0))
        current_occupancy = float(current_row.get("occupancy_pct", 25.0))
        capacity = float(current_row.get("capacity_veh_hr", 3000.0))
        free_flow_speed = float(current_row.get("free_flow_speed_kmh", 70.0))

        # Calculate momentum/trend if history exists
        vol_slope = 0.0
        spd_slope = 0.0
        if len(edge_history) >= 2:
            try:
                vols = edge_history["volume_veh_hr"].values
                spds = edge_history["avg_speed_kmh"].values
                x = np.arange(len(vols))
                if np.var(x) > 0:
                    vol_slope = np.polyfit(x, vols, 1)[0]
                    spd_slope = np.polyfit(x, spds, 1)[0]
            except Exception:
                pass

        # Dampen trend projection over longer horizons to avoid unbounded divergence
        forecasts = []
        base_confidence = {15: 0.93, 30: 0.87, 45: 0.81, 60: 0.74}

        for h in HORIZONS_MIN:
            step_factor = h / 15.0
            decay = 1.0 / (1.0 + 0.15 * step_factor)

            # Projected volume
            vol_delta = vol_slope * step_factor * decay
            predicted_vol = max(100.0, current_volume + vol_delta)

            # BPR speed physics check
            physics_speed = TrafficPhysics.calculate_speed_from_bpr(free_flow_speed, predicted_vol, capacity)
            trend_speed = max(5.0, min(free_flow_speed, current_speed + spd_slope * step_factor * decay))
            # Blend empirical trend with physical capacity constraint
            predicted_speed = round(0.6 * trend_speed + 0.4 * physics_speed, 1)

            # Confidence interval bounds (approx 95% interval widening with horizon)
            uncertainty_vol = (1.0 - base_confidence[h]) * predicted_vol * 1.2
            uncertainty_spd = (1.0 - base_confidence[h]) * predicted_speed * 1.1

            vol_ci_lower = round(max(50.0, predicted_vol - uncertainty_vol), 1)
            vol_ci_upper = round(predicted_vol + uncertainty_vol, 1)

            spd_ci_lower = round(max(5.0, predicted_speed - uncertainty_spd), 1)
            spd_ci_upper = round(min(free_flow_speed, predicted_speed + uncertainty_spd), 1)

            # Projected occupancy and congestion
            predicted_occ = round(min(100.0, max(0.0, (predicted_vol / max(capacity, 1.0)) * 60.0 + (1.0 - predicted_speed/free_flow_speed)*40.0)), 1)
            vc = round(predicted_vol / max(capacity, 1.0), 3)
            sr = round(predicted_speed / max(free_flow_speed, 1.0), 3)
            los = TrafficPhysics.get_level_of_service(vc, sr)
            congestion_score = TrafficPhysics.calculate_congestion_score(vc, predicted_speed, free_flow_speed, predicted_occ)

            forecasts.append({
                "horizon_minutes": h,
                "confidence_score": base_confidence[h],
                "predicted_volume_veh_hr": round(predicted_vol, 1),
                "volume_ci_lower": vol_ci_lower,
                "volume_ci_upper": vol_ci_upper,
                "predicted_avg_speed_kmh": predicted_speed,
                "speed_ci_lower": spd_ci_lower,
                "speed_ci_upper": spd_ci_upper,
                "predicted_occupancy_pct": predicted_occ,
                "predicted_vc_ratio": vc,
                "predicted_los": los,
                "predicted_congestion_score": congestion_score
            })

        return forecasts

    @classmethod
    def generate_network_forecasts(cls, df: pd.DataFrame) -> Dict[str, List[Dict[str, Any]]]:
        """Generates multi-horizon forecasts for all edges in the network."""
        results = {}
        unique_edges = df["edge_id"].unique()

        for eid in unique_edges:
            edge_df = df[df["edge_id"] == eid].sort_values(by="timestamp" if "timestamp" in df.columns else "edge_id")
            current_row = edge_df.iloc[-1]
            edge_forecasts = cls.forecast_edge_state(edge_df, current_row)
            results[str(eid)] = edge_forecasts

        return results

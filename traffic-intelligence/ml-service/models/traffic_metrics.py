import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

BPR_ALPHA = 0.15
BPR_BETA = 4.0

class TrafficPhysics:
    """Bureau of Public Roads (BPR) volume-delay physics and Level of Service (LOS) calculations."""

    @staticmethod
    def calculate_bpr_travel_time(
        free_flow_travel_time: float,
        volume: float,
        capacity: float,
        alpha: float = BPR_ALPHA,
        beta: float = BPR_BETA
    ) -> float:
        """Calculates travel time using the standard BPR formulation:
           t = t0 * (1 + alpha * (V/C)^beta)
        """
        vc_ratio = max(0.0, volume / max(capacity, 1.0))
        travel_time = free_flow_travel_time * (1.0 + alpha * (vc_ratio ** beta))
        return round(travel_time, 2)

    @staticmethod
    def calculate_speed_from_bpr(
        free_flow_speed: float,
        volume: float,
        capacity: float,
        alpha: float = BPR_ALPHA,
        beta: float = BPR_BETA
    ) -> float:
        """Calculates effective speed: v = v0 / (1 + alpha * (V/C)^beta)"""
        vc_ratio = max(0.0, volume / max(capacity, 1.0))
        speed = free_flow_speed / (1.0 + alpha * (vc_ratio ** beta))
        return round(max(5.0, speed), 2)

    @staticmethod
    def get_level_of_service(vc_ratio: float, speed_ratio: float) -> str:
        """Determines HCM Level of Service (A to F)."""
        if vc_ratio <= 0.35 and speed_ratio >= 0.90:
            return "A"
        elif vc_ratio <= 0.55 and speed_ratio >= 0.78:
            return "B"
        elif vc_ratio <= 0.75 and speed_ratio >= 0.65:
            return "C"
        elif vc_ratio <= 0.90 and speed_ratio >= 0.50:
            return "D"
        elif vc_ratio <= 1.05 and speed_ratio >= 0.35:
            return "E"
        else:
            return "F"

    @staticmethod
    def calculate_congestion_score(vc_ratio: float, speed: float, free_flow_speed: float, occupancy: float) -> float:
        """Computes a normalized congestion score from 0 (free flow) to 100 (gridlock)."""
        ffs = max(free_flow_speed, 10.0)
        speed_deficit = max(0.0, (ffs - speed) / ffs) * 100.0
        vc_component = min(150.0, vc_ratio * 100.0)
        occ_component = min(100.0, occupancy)

        # Weighted combination of speed drop, capacity saturation, and sensor occupancy
        score = 0.40 * speed_deficit + 0.35 * vc_component + 0.25 * occ_component
        return round(min(100.0, max(0.0, score)), 1)

    @classmethod
    def enrich_network_metrics(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Calculates V/C, LOS, Congestion Score, and aggregate network health."""
        df = df.copy()

        df["vc_ratio"] = (df["volume_veh_hr"] / df["capacity_veh_hr"].replace(0, 1.0)).round(3)
        df["speed_ratio"] = (df["avg_speed_kmh"] / df["free_flow_speed_kmh"].replace(0, 1.0)).round(3)

        # Vectorized or row-wise calculations
        los_list = []
        congestion_scores = []

        for _, row in df.iterrows():
            vc = row["vc_ratio"]
            sr = row["speed_ratio"]
            spd = row["avg_speed_kmh"]
            ffs = row["free_flow_speed_kmh"]
            occ = row["occupancy_pct"]

            los = cls.get_level_of_service(vc, sr)
            c_score = cls.calculate_congestion_score(vc, spd, ffs, occ)

            los_list.append(los)
            congestion_scores.append(c_score)

        df["los"] = los_list
        df["congestion_score"] = congestion_scores

        # Aggregate summary metrics
        avg_congestion = float(df["congestion_score"].mean())
        network_health = round(max(0.0, 100.0 - avg_congestion), 1)

        summary = {
            "total_links": len(df),
            "network_health_index": network_health,
            "average_vc_ratio": round(float(df["vc_ratio"].mean()), 3),
            "average_speed_kmh": round(float(df["avg_speed_kmh"].mean()), 2),
            "los_distribution": df["los"].value_counts().to_dict(),
            "congested_link_count": int((df["congestion_score"] >= 65.0).sum()),
            "severe_link_count": int((df["congestion_score"] >= 85.0).sum())
        }

        return df, summary

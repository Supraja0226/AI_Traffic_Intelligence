import pandas as pd
from typing import Dict, Any, List
from app.agents.base_agent import BaseTrafficAgent
from models.traffic_metrics import TrafficPhysics

class NetworkOptimizationAgent(BaseTrafficAgent):
    """Agent 6: Identifies recurring bottlenecks, simulates modifications (add lane, change connectivity, capacity) with before/after metrics."""

    def __init__(self):
        super().__init__(
            agent_id="AGENT_06_NETWORK_OPTIMIZATION",
            name="Network Optimization Agent",
            role="Detects recurring structural bottlenecks and simulates infrastructure modifications (e.g., lane addition) using BPR curves"
        )

    @staticmethod
    def simulate_lane_addition(edge_data: Dict[str, Any], lanes_to_add: int = 1) -> Dict[str, Any]:
        """Simulates adding 1 or more lanes to a road edge and recalculates traffic performance."""
        curr_lanes = int(edge_data.get("lanes", 2))
        new_lanes = curr_lanes + lanes_to_add

        curr_cap = float(edge_data.get("capacity_veh_hr", 2000.0))
        # Proportional capacity expansion (approx 1,200 - 1,800 veh/hr per arterial lane)
        capacity_per_lane = curr_cap / max(curr_lanes, 1)
        new_cap = curr_cap + (capacity_per_lane * lanes_to_add)

        vol = float(edge_data.get("volume_veh_hr", 2500.0))
        ffs = float(edge_data.get("free_flow_speed_kmh", 60.0))
        curr_tt = float(edge_data.get("travel_time_sec", 180.0))

        # Baseline metrics
        curr_vc = round(vol / max(curr_cap, 1.0), 3)
        curr_spd = float(edge_data.get("avg_speed_kmh", 25.0))

        # Recalculate using BPR equation under new capacity
        # Baseline free flow travel time: t0 = length / ffs or derived from curr_tt / (1 + 0.15*(curr_vc)^4)
        denominator = 1.0 + 0.15 * (curr_vc ** 4.0)
        t0 = max(10.0, curr_tt / max(denominator, 0.1))

        sim_tt = TrafficPhysics.calculate_bpr_travel_time(t0, vol, new_cap)
        sim_spd = TrafficPhysics.calculate_speed_from_bpr(ffs, vol, new_cap)
        sim_vc = round(vol / max(new_cap, 1.0), 3)

        tt_savings_sec = round(curr_tt - sim_tt, 1)
        spd_gain_kmh = round(sim_spd - curr_spd, 1)
        vc_reduction = round(curr_vc - sim_vc, 3)

        # Estimate annualized delay savings: assume 4 peak hours/day * 250 weekdays
        peak_volume_annual = vol * 4 * 250
        annual_person_hours_saved = round((peak_volume_annual * max(0.0, tt_savings_sec)) / 3600.0, 1)

        return {
            "target_edge_id": edge_data.get("edge_id"),
            "road_name": edge_data.get("road_name"),
            "modification_type": f"ADD_{lanes_to_add}_LANE",
            "before": {
                "lanes": curr_lanes,
                "capacity_veh_hr": curr_cap,
                "vc_ratio": curr_vc,
                "avg_speed_kmh": curr_spd,
                "travel_time_sec": curr_tt,
                "los": TrafficPhysics.get_level_of_service(curr_vc, curr_spd / ffs)
            },
            "after": {
                "lanes": new_lanes,
                "capacity_veh_hr": new_cap,
                "vc_ratio": sim_vc,
                "avg_speed_kmh": sim_spd,
                "travel_time_sec": sim_tt,
                "los": TrafficPhysics.get_level_of_service(sim_vc, sim_spd / ffs)
            },
            "delta": {
                "travel_time_savings_sec": tt_savings_sec,
                "speed_gain_kmh": spd_gain_kmh,
                "vc_ratio_reduction": vc_reduction,
                "annual_person_hours_saved": annual_person_hours_saved
            },
            "stated_assumptions": [
                "Software simulation model using standard BPR delay parameterization (alpha=0.15, beta=4.0).",
                "Fixed demand volume assumption to isolate pure physical capacity contribution.",
                "Advisory and decision-support only; physical roadway construction requires civil engineering review."
            ]
        }

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        network_state = state.get("current_network_state", [])
        classified_edges = state.get("classified_edges", [])

        if not network_state:
            raise ValueError("No network state provided for Network Optimization.")

        # Identify top recurring bottlenecks (VC > 0.85 or Congestion Score > 60)
        bottlenecks = []
        for edge in network_state:
            vc = float(edge.get("vc_ratio", 0.0))
            c_score = float(edge.get("congestion_score", 0.0))
            if vc >= 0.85 or c_score >= 60.0:
                bottlenecks.append(edge)

        self.log(f"Identified {len(bottlenecks)} bottleneck candidates for optimization simulation.")

        recommendations = []
        for b in bottlenecks[:5]:
            sim_res = self.simulate_lane_addition(b, lanes_to_add=1)
            recommendations.append(sim_res)

            self.record_evidence(
                title=f"Lane Expansion Simulation: {b.get('road_name')}",
                metrics={
                    "edge_id": b.get("edge_id"),
                    "before_vc": sim_res["before"]["vc_ratio"],
                    "after_vc": sim_res["after"]["vc_ratio"],
                    "travel_time_saved_sec": sim_res["delta"]["travel_time_savings_sec"],
                    "speed_gain_kmh": sim_res["delta"]["speed_gain_kmh"]
                },
                rationale=f"Adding 1 lane lowers V/C ratio by {sim_res['delta']['vc_ratio_reduction']} and saves ~{sim_res['delta']['annual_person_hours_saved']} hours of delay annually."
            )

        return {
            "bottlenecks_detected": len(bottlenecks),
            "recommendations": recommendations,
            "total_simulated": len(recommendations)
        }

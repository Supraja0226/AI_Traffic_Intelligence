import pandas as pd
from typing import Dict, Any, List
from app.agents.base_agent import BaseTrafficAgent

class IncidentAnalysisAgent(BaseTrafficAgent):
    """Agent 3: Analyzes anomalies, classifies incident types ONLY when empirical evidence strictly supports it."""

    def __init__(self):
        super().__init__(
            agent_id="AGENT_03_INCIDENT_ANALYSIS",
            name="Incident Analysis Agent",
            role="Evaluates traffic anomalies against multi-sensor empirical signatures to classify incidents with strict safety thresholds"
        )

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        classified_edges = state.get("classified_edges", [])
        network_state = state.get("current_network_state", [])

        if not classified_edges:
            self.log("No classified edges available. Incident evaluation aborted.")
            return {"incidents": [], "unconfirmed_anomalies": [], "safety_audit": "No data passed"}

        edge_map = {e["edge_id"]: e for e in network_state}
        self.log(f"Screening {len(classified_edges)} segments for incident-grade signatures...")

        confirmed_incidents = []
        unconfirmed_anomalies = []

        for item in classified_edges:
            eid = item.get("edge_id")
            raw_edge = edge_map.get(eid, {})

            speed = float(item.get("speed_kmh", 60.0))
            free_flow_speed = float(raw_edge.get("free_flow_speed_kmh", 60.0))
            occupancy = float(item.get("occupancy_pct", 0.0))
            vc_ratio = float(item.get("vc_ratio", 0.0))
            congestion_score = float(item.get("congestion_score", 0.0))

            speed_drop_pct = max(0.0, (free_flow_speed - speed) / max(free_flow_speed, 1.0)) * 100.0

            # STRICT EVIDENCE THRESHOLD EVALUATION
            # An incident requires corroborating evidence across speed deficit, detector occupancy, and congestion severity.
            has_speed_collapse = speed_drop_pct >= 60.0
            has_queue_occupancy = occupancy >= 75.0
            has_severe_congestion = congestion_score >= 80.0

            corroborating_factors = sum([has_speed_collapse, has_queue_occupancy, has_severe_congestion])

            if corroborating_factors >= 3:
                # Classify specific incident type strictly based on signature
                if speed <= 15.0 and occupancy >= 85.0:
                    incident_type = "MAJOR_INCIDENT_OR_ACCIDENT"
                    severity = "CRITICAL"
                    confidence = 0.92
                    description = f"Severe stoppage on {item.get('road_name')}: speed at {speed} km/h with extreme detector occupancy {occupancy}%."
                elif occupancy >= 80.0 and vc_ratio >= 1.0:
                    incident_type = "LANE_BLOCKAGE"
                    severity = "HIGH"
                    confidence = 0.88
                    description = f"Physical throughput restriction detected on {item.get('road_name')}: capacity breakdown with {occupancy}% sensor density."
                else:
                    incident_type = "STALLED_VEHICLE_OR_OBSTRUCTION"
                    severity = "MEDIUM"
                    confidence = 0.81
                    description = f"Localized obstruction on {item.get('road_name')}: speed reduced by {round(speed_drop_pct, 1)}%."

                incident_record = {
                    "incident_id": f"INC_{eid}_{int(pd.Timestamp.now().timestamp())}",
                    "edge_id": eid,
                    "road_name": item.get("road_name"),
                    "incident_type": incident_type,
                    "severity": severity,
                    "confidence_score": confidence,
                    "description": description,
                    "supporting_evidence": {
                        "speed_drop_pct": round(speed_drop_pct, 1),
                        "current_speed_kmh": speed,
                        "free_flow_speed_kmh": free_flow_speed,
                        "occupancy_pct": occupancy,
                        "vc_ratio": vc_ratio,
                        "congestion_score": congestion_score,
                        "criteria_met": ["SPEED_COLLAPSE_MET", "HIGH_OCCUPANCY_MET", "SEVERE_CONGESTION_MET"]
                    },
                    "recommendation": "Operator verification advised; evaluate alternate corridor diversion."
                }
                confirmed_incidents.append(incident_record)

                self.record_evidence(
                    title=f"Confirmed Incident on {item.get('road_name')}",
                    metrics=incident_record["supporting_evidence"],
                    rationale=f"Empirical evidence meets all 3 strict safety criteria: {speed_drop_pct:.1f}% speed drop, {occupancy}% occupancy."
                )

            elif item.get("is_statistical_anomaly"):
                # Safety guardrail: Anomaly detected, but insufficient evidence to confirm a physical incident
                unconfirmed_anomalies.append({
                    "edge_id": eid,
                    "road_name": item.get("road_name"),
                    "status": "INSUFFICIENT_EVIDENCE_FOR_INCIDENT",
                    "reason": f"Speed drop of {speed_drop_pct:.1f}% or occupancy of {occupancy}% did not meet strict multi-sensor threshold.",
                    "action": "Monitoring link without raising incident alert."
                })
                self.log(f"Safety constraint upheld: Anomaly on {eid} withheld from incident classification due to insufficient evidence.")

        self.log(f"Incident evaluation complete: {len(confirmed_incidents)} confirmed, {len(unconfirmed_anomalies)} unconfirmed anomalies.")

        return {
            "confirmed_incidents": confirmed_incidents,
            "unconfirmed_anomalies": unconfirmed_anomalies,
            "total_incidents_confirmed": len(confirmed_incidents),
            "safety_policy": "STRICT_EVIDENCE_ONLY_NO_FABRICATIONS"
        }

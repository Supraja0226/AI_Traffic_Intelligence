import networkx as nx
import pandas as pd
from typing import Dict, List, Any, Optional

class RoadNetworkGraph:
    """Graph engine built on NetworkX for spatial topology, routing, and alternate path discovery."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.edge_metadata: Dict[str, Dict[str, Any]] = {}
        self.node_metadata: Dict[str, Dict[str, Any]] = {}

    def build_from_dataframe(self, df: pd.DataFrame) -> None:
        self.graph.clear()
        self.edge_metadata.clear()
        self.node_metadata.clear()

        for idx, row in df.iterrows():
            edge_id = str(row.get("edge_id", f"EDGE_{idx}"))
            source = str(row.get("source_node", f"N_{edge_id}_src"))
            target = str(row.get("target_node", f"N_{edge_id}_dst"))

            free_flow_speed = float(row.get("free_flow_speed_kmh", 60.0))
            avg_speed = float(row.get("avg_speed_kmh", free_flow_speed))
            capacity = float(row.get("capacity_veh_hr", 2000.0))
            volume = float(row.get("volume_veh_hr", 0.0))
            travel_time = float(row.get("travel_time_sec", 120.0))
            road_name = str(row.get("road_name", f"Road {edge_id}"))
            lanes = int(row.get("lanes", 2))

            meta = {
                "edge_id": edge_id,
                "source": source,
                "target": target,
                "road_name": road_name,
                "capacity": capacity,
                "volume": volume,
                "avg_speed": avg_speed,
                "free_flow_speed": free_flow_speed,
                "travel_time": travel_time,
                "lanes": lanes,
                "geometry": row.get("geometry", None)
            }

            self.edge_metadata[edge_id] = meta
            self.graph.add_node(source)
            self.graph.add_node(target)
            # Edge weight uses travel time impedance
            self.graph.add_edge(source, target, weight=max(travel_time, 1.0), **meta)

    def find_alternate_paths(self, source: str, target: str, exclude_edge_id: Optional[str] = None, max_paths: int = 3) -> List[Dict[str, Any]]:
        """Finds shortest / alternative paths avoiding a heavily congested or blocked edge."""
        if not self.graph.has_node(source) or not self.graph.has_node(target):
            return []

        # Create temporary subgraph excluding the congested link
        H = self.graph.copy()
        if exclude_edge_id:
            edges_to_remove = [(u, v) for u, v, d in H.edges(data=True) if d.get("edge_id") == exclude_edge_id]
            for u, v in edges_to_remove:
                H.remove_edge(u, v)

        results = []
        try:
            paths = list(nx.shortest_simple_paths(H, source, target, weight="weight"))
            for p in paths[:max_paths]:
                path_edges = []
                total_tt = 0.0
                for i in range(len(p) - 1):
                    u, v = p[i], p[i+1]
                    edge_data = H.get_edge_data(u, v)
                    if edge_data:
                        eid = edge_data.get("edge_id")
                        tt = edge_data.get("travel_time", 60.0)
                        total_tt += tt
                        path_edges.append({
                            "edge_id": eid,
                            "road_name": edge_data.get("road_name"),
                            "travel_time_sec": tt
                        })
                results.append({
                    "node_path": p,
                    "edges": path_edges,
                    "total_travel_time_sec": round(total_tt, 1)
                })
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            pass

        return results

    def get_network_topology_summary(self) -> Dict[str, Any]:
        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "is_connected": nx.is_weakly_connected(self.graph) if self.graph.number_of_nodes() > 0 else False,
            "density": round(nx.density(self.graph), 4) if self.graph.number_of_nodes() > 0 else 0.0
        }

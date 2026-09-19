import os
import json
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List, Optional

COLUMN_ALIASES = {
    "timestamp": ["timestamp", "time", "date_time", "datetime", "record_time", "ts"],
    "edge_id": ["edge_id", "link_id", "road_id", "segment_id", "id", "edgeId", "linkId"],
    "road_name": ["road_name", "street_name", "name", "corridor_name", "road"],
    "source_node": ["source_node", "source", "from_node", "start_node", "origin_node", "from"],
    "target_node": ["target_node", "target", "to_node", "end_node", "dest_node", "to"],
    "volume_veh_hr": ["volume_veh_hr", "volume", "flow", "vehicle_count", "veh_count", "flow_rate", "traffic_volume"],
    "avg_speed_kmh": ["avg_speed_kmh", "avg_speed", "speed_kmh", "speed", "velocity_kmh", "mean_speed"],
    "occupancy_pct": ["occupancy_pct", "occupancy", "occ_pct", "density_pct", "detector_occupancy"],
    "travel_time_sec": ["travel_time_sec", "travel_time", "tt_sec", "travel_time_seconds", "duration_sec"],
    "capacity_veh_hr": ["capacity_veh_hr", "capacity", "design_capacity", "max_capacity", "cap_veh_hr"],
    "free_flow_speed_kmh": ["free_flow_speed_kmh", "free_flow_speed", "ffs_kmh", "speed_limit", "free_speed"],
    "lanes": ["lanes", "lane_count", "num_lanes", "number_of_lanes"]
}

class DatasetCleaner:
    """Validates, cleans, and standardizes multi-format traffic datasets."""

    @staticmethod
    def _map_columns(df: pd.DataFrame) -> pd.DataFrame:
        renamed = {}
        for canonical, aliases in COLUMN_ALIASES.items():
            for col in df.columns:
                clean_col = str(col).strip().lower().replace(" ", "_").replace("-", "_")
                if clean_col in [a.lower() for a in aliases]:
                    renamed[col] = canonical
                    break
        df = df.rename(columns=renamed)
        return df

    @classmethod
    def load_and_standardize(cls, file_path_or_buffer: Any, file_type: Optional[str] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Loads CSV, JSON, Excel, or GeoJSON and returns (clean_dataframe, validation_report)."""
        validation_report = {
            "is_valid": True,
            "detected_format": None,
            "original_rows": 0,
            "cleaned_rows": 0,
            "missing_values_handled": 0,
            "columns_detected": [],
            "warnings": [],
            "errors": []
        }

        # Determine file type
        ext = None
        if isinstance(file_path_or_buffer, str):
            ext = os.path.splitext(file_path_or_buffer)[1].lower().replace(".", "")
        if file_type:
            ext = file_type.lower().replace(".", "")

        try:
            if ext in ["csv", "txt"]:
                validation_report["detected_format"] = "CSV"
                df = pd.read_csv(file_path_or_buffer)
            elif ext in ["xlsx", "xls"]:
                validation_report["detected_format"] = "EXCEL"
                # If multiple sheets, read the first or the one containing traffic observations
                xl = pd.ExcelFile(file_path_or_buffer, engine="openpyxl")
                sheet_to_use = xl.sheet_names[0]
                for s in xl.sheet_names:
                    if "observation" in s.lower() or "reading" in s.lower() or "traffic" in s.lower():
                        sheet_to_use = s
                        break
                df = xl.parse(sheet_to_use)
            elif ext in ["json", "geojson"]:
                validation_report["detected_format"] = "JSON/GEOJSON"
                if isinstance(file_path_or_buffer, str):
                    with open(file_path_or_buffer, "r", encoding="utf-8") as f:
                        raw_data = json.load(f)
                else:
                    raw_data = json.load(file_path_or_buffer)

                # Check if GeoJSON FeatureCollection
                if isinstance(raw_data, dict) and raw_data.get("type") == "FeatureCollection":
                    records = []
                    for f in raw_data.get("features", []):
                        props = f.get("properties", {})
                        geom = f.get("geometry", {})
                        if geom.get("type") == "LineString":
                            props["geometry"] = geom
                        records.append(props)
                    df = pd.DataFrame(records)
                elif isinstance(raw_data, dict) and "records" in raw_data:
                    df = pd.DataFrame(raw_data["records"])
                elif isinstance(raw_data, list):
                    df = pd.DataFrame(raw_data)
                else:
                    df = pd.DataFrame([raw_data])
            else:
                # Default attempt CSV
                validation_report["detected_format"] = "CSV (Fallback)"
                df = pd.read_csv(file_path_or_buffer)

            validation_report["original_rows"] = len(df)
            df = cls._map_columns(df)
            validation_report["columns_detected"] = list(df.columns)

            # Check critical columns
            required_cols = ["edge_id"]
            for req in required_cols:
                if req not in df.columns:
                    validation_report["errors"].append(f"Missing mandatory column '{req}'")
                    validation_report["is_valid"] = False

            # Fill missing numerical columns with sensible physical baselines if omitted
            defaults = {
                "volume_veh_hr": 2200.0,
                "avg_speed_kmh": 45.0,
                "capacity_veh_hr": 2000.0,
                "free_flow_speed_kmh": 60.0,
                "lanes": 2,
                "occupancy_pct": 20.0,
                "travel_time_sec": 120.0
            }

            for col, val in defaults.items():
                if col not in df.columns:
                    df[col] = val
                    validation_report["warnings"].append(f"Missing optional column '{col}' - set to default {val}")

            # Ensure numeric types
            numeric_cols = ["volume_veh_hr", "avg_speed_kmh", "occupancy_pct", "travel_time_sec", "capacity_veh_hr", "free_flow_speed_kmh", "lanes"]
            for col in numeric_cols:
                if col in df.columns:
                    before_nulls = df[col].isnull().sum()
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                    # Handle NaNs
                    median_val = df[col].median()
                    if pd.isna(median_val):
                        median_val = defaults.get(col, 0.0)
                    df[col] = df[col].fillna(median_val)
                    after_nulls = df[col].isnull().sum()
                    validation_report["missing_values_handled"] += int(before_nulls - after_nulls)

            # Ensure timestamp exists or create a synthetic current timestamp
            if "timestamp" not in df.columns:
                df["timestamp"] = pd.Timestamp.now(tz="UTC").isoformat()
                validation_report["warnings"].append("No timestamp column detected. Assigned current UTC timestamp.")
            else:
                df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce").fillna(pd.Timestamp.now(tz="UTC")).astype(str)

            # Validate physical boundaries
            df["avg_speed_kmh"] = df["avg_speed_kmh"].clip(lower=0.1, upper=180.0)
            df["occupancy_pct"] = df["occupancy_pct"].clip(lower=0.0, upper=100.0)
            df["volume_veh_hr"] = df["volume_veh_hr"].clip(lower=0.0, upper=12000.0)
            df["capacity_veh_hr"] = df["capacity_veh_hr"].clip(lower=100.0, upper=15000.0)

            validation_report["cleaned_rows"] = len(df)
            return df, validation_report

        except Exception as e:
            validation_report["is_valid"] = False
            validation_report["errors"].append(str(e))
            return pd.DataFrame(), validation_report

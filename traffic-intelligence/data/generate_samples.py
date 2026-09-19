import os
import pandas as pd

output_dir = os.path.join(os.path.dirname(__file__), 'samples')
os.makedirs(output_dir, exist_ok=True)
excel_path = os.path.join(output_dir, 'highway_arterials_study.xlsx')

df_corridors = pd.DataFrame([
    {'edge_id': 'EDGE_101', 'road_name': 'Grand Avenue Express', 'lanes': 3, 'capacity_veh_hr': 3600, 'free_flow_speed_kmh': 70, 'length_km': 4.2},
    {'edge_id': 'EDGE_102', 'road_name': 'North Ring Bypass', 'lanes': 2, 'capacity_veh_hr': 3000, 'free_flow_speed_kmh': 80, 'length_km': 4.8},
    {'edge_id': 'EDGE_103', 'road_name': 'Bypass Connector East', 'lanes': 2, 'capacity_veh_hr': 2400, 'free_flow_speed_kmh': 60, 'length_km': 3.6},
    {'edge_id': 'EDGE_104', 'road_name': 'South Waterfront Blvd', 'lanes': 2, 'capacity_veh_hr': 2200, 'free_flow_speed_kmh': 50, 'length_km': 3.9},
    {'edge_id': 'EDGE_105', 'road_name': 'Waterfront East Link', 'lanes': 2, 'capacity_veh_hr': 2200, 'free_flow_speed_kmh': 50, 'length_km': 3.8}
])

df_readings = pd.DataFrame([
    {'timestamp': '2026-09-19T08:00:00Z', 'edge_id': 'EDGE_101', 'volume_veh_hr': 4050, 'avg_speed_kmh': 14.8, 'occupancy_pct': 87.5, 'travel_time_sec': 495},
    {'timestamp': '2026-09-19T08:00:00Z', 'edge_id': 'EDGE_102', 'volume_veh_hr': 2250, 'avg_speed_kmh': 65.8, 'occupancy_pct': 24.2, 'travel_time_sec': 112},
    {'timestamp': '2026-09-19T08:00:00Z', 'edge_id': 'EDGE_103', 'volume_veh_hr': 1820, 'avg_speed_kmh': 51.2, 'occupancy_pct': 25.5, 'travel_time_sec': 140},
    {'timestamp': '2026-09-19T08:00:00Z', 'edge_id': 'EDGE_104', 'volume_veh_hr': 1520, 'avg_speed_kmh': 46.1, 'occupancy_pct': 32.0, 'travel_time_sec': 154},
    {'timestamp': '2026-09-19T08:00:00Z', 'edge_id': 'EDGE_105', 'volume_veh_hr': 1460, 'avg_speed_kmh': 47.7, 'occupancy_pct': 30.9, 'travel_time_sec': 150}
])

with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
    df_corridors.to_excel(writer, sheet_name='Corridor_Inventory', index=False)
    df_readings.to_excel(writer, sheet_name='Peak_Traffic_Observations', index=False)

print(f"Generated {excel_path} successfully")

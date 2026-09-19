const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/User');
const Dataset = require('../models/Dataset');
const TrafficState = require('../models/TrafficState');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const { connectDB } = require('../config/db');

const seedInitialData = async () => {
  console.log('[Seed] Checking initial seed data...');

  // 1. Seed RBAC Users
  const defaultUsers = [
    { username: 'admin', email: 'admin@traffic.ai', password: 'Admin@123', role: 'admin', name: 'Chief Operations Administrator' },
    { username: 'analyst', email: 'analyst@traffic.ai', password: 'Analyst@123', role: 'analyst', name: 'Senior Traffic Data Analyst' },
    { username: 'operator', email: 'operator@traffic.ai', password: 'Operator@123', role: 'operator', name: 'TMC Dispatch Operator' },
    { username: 'viewer', email: 'viewer@traffic.ai', password: 'Viewer@123', role: 'viewer', name: 'Public Mobility Observer' }
  ];

  for (const u of defaultUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        name: u.name,
        organization: 'Metropolitan Transportation Authority'
      });
      console.log(`[Seed] Created demo user: ${u.email} (${u.role})`);
    }
  }

  // 2. Seed Sample Datasets catalog
  const sampleDatasets = [
    {
      name: 'Metro Corridor Traffic Stream',
      format: 'CSV',
      filePath: path.join(__dirname, '..', '..', 'data', 'samples', 'metro_corridor_traffic.csv'),
      recordCount: 31,
      status: 'VALIDATED'
    },
    {
      name: 'Urban Road Network Topology',
      format: 'GEOJSON',
      filePath: path.join(__dirname, '..', '..', 'data', 'samples', 'urban_network.geojson'),
      recordCount: 6,
      status: 'VALIDATED'
    },
    {
      name: 'Peak Hour Detector Telemetry',
      format: 'JSON',
      filePath: path.join(__dirname, '..', '..', 'data', 'samples', 'peak_hour_sensor_data.json'),
      recordCount: 6,
      status: 'VALIDATED'
    },
    {
      name: 'Highway Arterials Capacity Study',
      format: 'EXCEL',
      filePath: path.join(__dirname, '..', '..', 'data', 'samples', 'highway_arterials_study.xlsx'),
      recordCount: 10,
      status: 'VALIDATED'
    }
  ];

  for (const s of sampleDatasets) {
    const exists = await Dataset.findOne({ name: s.name });
    if (!exists) {
      await Dataset.create(s);
      console.log(`[Seed] Registered sample dataset catalog: ${s.name}`);
    }
  }

  // 3. Seed initial baseline Traffic State
  const initialStates = [
    { edgeId: 'EDGE_101', roadName: 'Grand Avenue Express', volumeVehHr: 4100, avgSpeedKmh: 14.2, occupancyPct: 88.4, travelTimeSec: 507, capacityVehHr: 3600, freeFlowSpeedKmh: 70, vcRatio: 1.139, los: 'F', congestionScore: 89.2, congestionLevel: 'SEVERE', isAnomaly: true },
    { edgeId: 'EDGE_102', roadName: 'North Ring Bypass', volumeVehHr: 2300, avgSpeedKmh: 65.0, occupancyPct: 25.0, travelTimeSec: 111, capacityVehHr: 3000, freeFlowSpeedKmh: 80, vcRatio: 0.767, los: 'C', congestionScore: 32.4, congestionLevel: 'LIGHT', isAnomaly: false },
    { edgeId: 'EDGE_103', roadName: 'Bypass Connector East', volumeVehHr: 1850, avgSpeedKmh: 50.0, occupancyPct: 26.0, travelTimeSec: 144, capacityVehHr: 2400, freeFlowSpeedKmh: 60, vcRatio: 0.771, los: 'C', congestionScore: 37.1, congestionLevel: 'LIGHT', isAnomaly: false },
    { edgeId: 'EDGE_104', roadName: 'South Waterfront Blvd', volumeVehHr: 1750, avgSpeedKmh: 42.0, occupancyPct: 38.5, travelTimeSec: 171, capacityVehHr: 2200, freeFlowSpeedKmh: 50, vcRatio: 0.795, los: 'D', congestionScore: 44.8, congestionLevel: 'LIGHT', isAnomaly: false },
    { edgeId: 'EDGE_105', roadName: 'Waterfront East Link', volumeVehHr: 1680, avgSpeedKmh: 44.5, occupancyPct: 35.0, travelTimeSec: 162, capacityVehHr: 2200, freeFlowSpeedKmh: 50, vcRatio: 0.764, los: 'C', congestionScore: 40.2, congestionLevel: 'LIGHT', isAnomaly: false },
    { edgeId: 'EDGE_106', roadName: 'Central Midtown Corridor', volumeVehHr: 2950, avgSpeedKmh: 28.5, occupancyPct: 62.0, travelTimeSec: 253, capacityVehHr: 3200, freeFlowSpeedKmh: 55, vcRatio: 0.922, los: 'E', congestionScore: 68.9, congestionLevel: 'HEAVY', isAnomaly: false }
  ];

  const existingStates = await TrafficState.find();
  if (existingStates.length === 0) {
    for (const st of initialStates) {
      await TrafficState.create({
        datasetId: 'INITIAL_SEED',
        ...st,
        timestamp: new Date().toISOString()
      });
    }
    console.log(`[Seed] Seeded initial network state snapshot with ${initialStates.length} links.`);
  }

  // 4. Seed verified sample incident
  const existingIncidents = await Incident.find();
  if (existingIncidents.length === 0) {
    await Incident.create({
      incidentId: 'INC_EDGE_101_SEED',
      edgeId: 'EDGE_101',
      roadName: 'Grand Avenue Express',
      incidentType: 'MAJOR_INCIDENT_OR_ACCIDENT',
      severity: 'CRITICAL',
      confidenceScore: 0.92,
      description: 'Severe stoppage on Grand Avenue Express: speed collapsed to 14.2 km/h with 88.4% sensor occupancy and V/C ratio of 1.139.',
      supportingEvidence: {
        speed_drop_pct: 79.7,
        current_speed_kmh: 14.2,
        free_flow_speed_kmh: 70.0,
        occupancy_pct: 88.4,
        vc_ratio: 1.139,
        criteria_met: ['SPEED_COLLAPSE_MET', 'HIGH_OCCUPANCY_MET', 'SEVERE_CONGESTION_MET']
      }
    });
    console.log('[Seed] Seeded verified evidence-backed incident.');
  }

  // 5. Seed initial Notification
  const existingNotifs = await Notification.find();
  if (existingNotifs.length === 0) {
    await Notification.create({
      title: 'Platform Initialized',
      message: 'AI Traffic Intelligence and Road Network Optimization Platform is active in ADVISORY mode.',
      type: 'INFO',
      link: '/'
    });
  }

  console.log('[Seed] Seeding completed successfully.');
};

if (require.main === module) {
  connectDB().then(() => seedInitialData()).then(() => process.exit(0));
}

module.exports = { seedInitialData };

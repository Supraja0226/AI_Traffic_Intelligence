const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

class MLClient {
  static async checkHealth() {
    try {
      const res = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
      return { status: 'ONLINE', data: res.data };
    } catch (err) {
      return { status: 'OFFLINE', error: err.message };
    }
  }

  static async runPipeline(payload) {
    try {
      // Primary: Call running FastAPI server
      const res = await axios.post(`${ML_SERVICE_URL}/api/agents/pipeline`, payload, {
        timeout: 60000
      });
      return res.data;
    } catch (err) {
      console.warn(`[MLClient] FastAPI call failed (${err.message}). Executing Python agent pipeline runner fallback...`);
      return this._executePythonFallback(payload);
    }
  }

  static async runDiversionSimulation(payload) {
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/api/simulations/diversion`, payload, {
        timeout: 15000
      });
      return res.data;
    } catch (err) {
      console.warn(`[MLClient] FastAPI diversion failed. Running fallback...`);
      return this._executeDiversionFallback(payload);
    }
  }

  static async runModificationSimulation(payload) {
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/api/simulations/modification`, payload, {
        timeout: 15000
      });
      return res.data;
    } catch (err) {
      console.warn(`[MLClient] FastAPI modification failed. Running fallback...`);
      return this._executeModificationFallback(payload);
    }
  }

  static _executePythonFallback(payload) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '..', '..', 'ml-service', 'run_pipeline_cli.py');
      const pyProcess = spawn('python', [scriptPath], {
        cwd: path.join(__dirname, '..', '..', 'ml-service')
      });

      let stdout = '';
      let stderr = '';

      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();

      pyProcess.stdout.on('data', (d) => { stdout += d.toString(); });
      pyProcess.stderr.on('data', (d) => { stderr += d.toString(); });

      pyProcess.on('close', (code) => {
        if (code === 0 && stdout) {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(new Error(`Failed to parse Python fallback JSON: ${e.message}\n${stdout}`));
          }
        } else {
          reject(new Error(`Python fallback failed (code ${code}): ${stderr}`));
        }
      });
    });
  }

  static _executeDiversionFallback(payload) {
    // Pure JS BPR fallback for instant response
    const { congested_edge_id, diversion_pct = 15, network_state } = payload;
    const edge = network_state.find(e => e.edge_id === congested_edge_id) || network_state[0];
    const currVol = edge.volume_veh_hr || 3000;
    const cap = edge.capacity_veh_hr || 3000;
    const ffs = edge.free_flow_speed_kmh || 60;
    const currSpd = edge.avg_speed_kmh || 20;
    const currTt = edge.travel_time_sec || 180;

    const divPct = Math.min(50, Math.max(1, diversion_pct));
    const divertedVol = currVol * (divPct / 100);
    const newVol = currVol - divertedVol;

    const newVc = newVol / cap;
    const simSpd = ffs / (1 + 0.15 * Math.pow(newVc, 4));
    const simTt = currTt / (1 + 0.15 * Math.pow(currVol / cap, 4)) * (1 + 0.15 * Math.pow(newVc, 4));

    return {
      status: 'SIMULATION_SUCCESS',
      simulation_type: 'CORRIDOR_DIVERSION',
      diversion_percentage: divPct,
      diverted_volume_veh_hr: Math.round(divertedVol),
      primary_corridor: {
        edge_id: congested_edge_id,
        road_name: edge.road_name,
        before: { volume: currVol, avg_speed_kmh: currSpd, travel_time_sec: currTt, vc_ratio: +(currVol / cap).toFixed(3) },
        after: { volume: Math.round(newVol), avg_speed_kmh: +simSpd.toFixed(1), travel_time_sec: +simTt.toFixed(1), vc_ratio: +newVc.toFixed(3) },
        net_travel_time_saved_sec: +(currTt - simTt).toFixed(1),
        net_speed_gain_kmh: +(simSpd - currSpd).toFixed(1)
      },
      alternate_corridors: [],
      assumptions: ['Software simulation only. BPR volume-delay curve applied with alpha=0.15, beta=4.0.']
    };
  }

  static _executeModificationFallback(payload) {
    const { target_edge_id, lanes_to_add = 1, network_state } = payload;
    const edge = network_state.find(e => e.edge_id === target_edge_id) || network_state[0];
    const currLanes = edge.lanes || 2;
    const newLanes = currLanes + lanes_to_add;
    const currCap = edge.capacity_veh_hr || 2000;
    const newCap = currCap + (currCap / currLanes) * lanes_to_add;
    const vol = edge.volume_veh_hr || 2500;
    const ffs = edge.free_flow_speed_kmh || 60;
    const currSpd = edge.avg_speed_kmh || 25;
    const currTt = edge.travel_time_sec || 180;

    const currVc = +(vol / currCap).toFixed(3);
    const newVc = +(vol / newCap).toFixed(3);
    const simSpd = +(ffs / (1 + 0.15 * Math.pow(newVc, 4))).toFixed(1);
    const simTt = +(currTt * (1 + 0.15 * Math.pow(newVc, 4)) / (1 + 0.15 * Math.pow(currVc, 4))).toFixed(1);

    return {
      status: 'SIMULATION_SUCCESS',
      simulation: {
        target_edge_id,
        road_name: edge.road_name,
        modification_type: `ADD_${lanes_to_add}_LANE`,
        before: { lanes: currLanes, capacity_veh_hr: currCap, vc_ratio: currVc, avg_speed_kmh: currSpd, travel_time_sec: currTt },
        after: { lanes: newLanes, capacity_veh_hr: newCap, vc_ratio: newVc, avg_speed_kmh: simSpd, travel_time_sec: simTt },
        delta: {
          travel_time_savings_sec: +(currTt - simTt).toFixed(1),
          speed_gain_kmh: +(simSpd - currSpd).toFixed(1),
          vc_ratio_reduction: +(currVc - newVc).toFixed(3),
          annual_person_hours_saved: Math.round((vol * 4 * 250 * Math.max(0, currTt - simTt)) / 3600)
        },
        stated_assumptions: ['Software simulation only. Assumes fixed demand and BPR parameters alpha=0.15, beta=4.0.']
      }
    };
  }
}

module.exports = MLClient;

# AI Traffic Intelligence & Road Network Optimization Platform

## 1. Project Overview
The AI Traffic Intelligence & Road Network Optimization Platform is a software-only AI system that analyzes organizer-provided traffic and road-network datasets to understand network conditions, identify congestion and abnormal traffic behavior, forecast future traffic states, generate evidence-based operational advisories, and recommend data-driven road-network improvements.

The platform is designed for simulation, analysis, forecasting, and decision support. It does not directly control traffic signals, access live roadside infrastructure, use cameras or GPS devices, or perform real-world construction.

---

## 2. Problem Statement
Build a software-only AI system that analyzes organizer-provided traffic and road-network datasets to create a continuously updated view of network conditions. The system should identify congestion and abnormal traffic behavior, detect or classify incidents where the available data supports it, forecast traffic states 15–60 minutes ahead, generate evidence-based operational/diversion advisories, and propose data-driven infrastructure or road-network modifications for recurring bottlenecks together with estimated before/after traffic impact.

All actions, diversion plans, and construction/network suggestions must remain simulated or advisory. No live signal control, camera access, GPS-device integration, roadside sensor integration, municipal infrastructure access, or actual construction work is required or permitted for judging.

---

## 3. Key Features
- **Dataset Management**: Upload and validate CSV, JSON, Excel, and GeoJSON traffic/network datasets.
- **Traffic Intelligence**: Calculate traffic volume, speed, occupancy, travel time, congestion score, and network health.
- **Congestion Detection**: Classify conditions as `FREE_FLOW`, `LIGHT`, `MODERATE`, `HEAVY`, or `SEVERE`.
- **Abnormal Behavior Detection**: Use statistical baselines and machine-learning anomaly detection.
- **Incident Analysis**: Detect or classify incidents only when the supplied data provides sufficient evidence.
- **Traffic Forecasting**: Forecast traffic conditions 15, 30, 45, and 60 minutes ahead with confidence estimates.
- **Advisories**: Generate simulated diversion, congestion, alternate-route, incident, capacity, and optimization advisories.
- **Route Simulation**: Compare traffic conditions before and after a proposed diversion.
- **Network Optimization**: Identify recurring bottlenecks and simulate road-network modifications.
- **Real-Time Dashboard**: Display analysis results, forecasts, alerts, recommendations, and execution status.
- **Execution Monitoring**: Maintain logs and a real-time agent execution timeline.

---

## 4. AI Agent Architecture
1. **Data Analysis Agent**: Validates datasets, cleans records, calculates traffic metrics, and creates the current network state.
2. **Congestion Detection Agent**: Identifies congestion levels and abnormal traffic patterns.
3. **Incident Analysis Agent**: Analyzes anomalies and classifies supported incident types.
4. **Forecasting Agent**: Predicts traffic states for 15–60 minutes ahead.
5. **Advisory Agent**: Generates evidence-based operational and diversion recommendations.
6. **Network Optimization Agent**: Evaluates recurring bottlenecks and simulates network modifications.
7. **Monitoring Agent**: Tracks agent execution, failures, completion status, and system events.

---

## 5. Technology Stack
- **Frontend**: Next.js (Pages Router), React 19, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.IO
- **AI/ML**: Python 3.10+, Pandas, NumPy, Gemini, LangChain, LangGraph, FastAPI
- **Data & Simulation**: CSV, JSON, Excel, GeoJSON

---

## 6. Project Structure
```
AI_Traffic_Intelligence/
├── backend/          # Express API server, routes, controllers, Mongoose models, agents
├── frontend/         # Next.js frontend application (Dashboard, Analysis, Advisories, Simulations)
├── ml-service/       # FastAPI Python ML service & LangChain/LangGraph agent pipeline
├── data/             # Input traffic & network datasets
├── simulations/      # Simulation scenarios & data exports
├── LICENSE
└── README.md
```

---

## 7. Data Flow
1. Upload organizer-provided datasets →
2. Validate and preprocess →
3. Build current network state →
4. Detect congestion and anomalies →
5. Analyze supported incidents →
6. Forecast 15–60 minute traffic states →
7. Simulate diversions →
8. Generate advisories →
9. Detect recurring bottlenecks →
10. Simulate network modifications →
11. Display evidence and estimated impact.

---

## 8. Supported Data
- **Traffic Data**: Timestamps, road/edge identifiers, vehicle counts, average speed, occupancy, travel time, origin/destination information, and other organizer-provided measurements.
- **Road-Network Data**: Nodes, links, road names, lane counts, capacities, speed limits, directions, intersections, coordinates, and connectivity.
- **Supported Formats**: CSV, JSON, XLSX/Excel, and GeoJSON.

---

## 9. Getting Started

### 9.1 Prerequisites
- Node.js (v18+) & npm
- Python 3.10+
- MongoDB & Redis
- Git

### 9.2 Clone & Setup Repository
```bash
git clone <your-repository-url>
cd AI_Traffic_Intelligence
```

### 9.3 Backend Setup
```bash
cd backend
npm install
npm run dev
```

Create `.env` inside `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/traffic_intelligence
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=your_api_key
GEMINI_API_KEY=your_api_key
FRONTEND_URL=http://localhost:3000
```

### 9.4 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Development server will run at `http://localhost:3000`.

### 9.5 Python ML Service Setup
```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 10. Safety & Scope
This project is strictly software-only and advisory. It must not directly control traffic signals, access municipal infrastructure, access roadside sensors or cameras, integrate with GPS devices for live tracking, or execute physical construction. Diversion plans and infrastructure modifications are simulations or recommendations for evaluation.

---

## 11. Development Principle
`Observe → Analyze → Forecast → Simulate → Advise → Evaluate`

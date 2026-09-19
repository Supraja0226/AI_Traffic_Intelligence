const express = require('express');
const http = require('http');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const { configureSecurityMiddleware } = require('./middleware/security');

const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const executionRoutes = require('./routes/executionRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure Security Middleware (Helmet, CORS, Rate Limit)
configureSecurityMiddleware(app);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/advisories', advisoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'AI Traffic Intelligence Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root disclaimer
app.get('/', (req, res) => {
  res.json({
    platform: 'AI Traffic Intelligence & Road Network Optimization Platform',
    status: 'ONLINE',
    regulatory_notice: 'SOFTWARE SIMULATION / DECISION SUPPORT ONLY. NOT A LIVE TRAFFIC CONTROL SYSTEM.',
    docs: '/docs'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Backend Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Run initial seeder automatically
  try {
    const { seedInitialData } = require('./scripts/seed');
    await seedInitialData();
  } catch (seedErr) {
    console.warn('[Seed] Auto-seeding skipped or already completed:', seedErr.message);
  }

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AI Traffic Intelligence Backend Running on Port ${PORT}`);
    console.log(`📡 WebSocket / Socket.IO Live Stream Active`);
    console.log(`🛡️  Safety Mode: ADVISORY & SIMULATION ONLY`);
    console.log(`=======================================================`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server };

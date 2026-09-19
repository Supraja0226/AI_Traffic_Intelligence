const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Welcome payload with system status
    socket.emit('system:status', {
      connected: true,
      timestamp: Date.now(),
      platform: 'AI Traffic Intelligence & Road Network Optimization'
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

const emitAgentEvent = (eventName, payload) => {
  if (io) {
    io.emit(eventName, payload);
  }
};

const emitTimelineLog = (executionId, agentName, level, message, evidence = null) => {
  if (io) {
    io.emit('timeline:log', {
      executionId,
      agentName,
      level,
      message,
      evidence,
      timestamp: new Date().toISOString()
    });
  }
};

const emitPipelineProgress = (executionId, step, totalSteps, activeAgent, status, data = null) => {
  if (io) {
    io.emit('pipeline:progress', {
      executionId,
      step,
      totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      activeAgent,
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

const emitAlert = (title, message, severity = 'WARNING', evidence = null) => {
  if (io) {
    io.emit('system:alert', {
      title,
      message,
      severity,
      evidence,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitAgentEvent,
  emitTimelineLog,
  emitPipelineProgress,
  emitAlert
};

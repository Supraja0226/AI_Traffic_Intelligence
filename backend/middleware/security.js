const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP address. Please try again later.' }
});

const configureSecurityMiddleware = (app) => {
  // Helmet with relaxed content security policy for local development & WebSockets
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiter
  app.use('/api/', apiLimiter);
};

module.exports = { configureSecurityMiddleware };

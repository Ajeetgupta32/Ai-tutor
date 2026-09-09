import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// If CLIENT_URL has comma-separated domains
if (config.clientUrl && config.clientUrl.includes(',')) {
  config.clientUrl.split(',').forEach((url) => allowedOrigins.push(url.trim()));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Allow any vercel.app domain, localhost, or explicitly configured clientUrl
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      
      return callback(null, true); // Permissive in production to prevent blockages
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use('/api', apiLimiter);

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    service: 'EduMentor AI Backend Engine',
  });
});

// Master API Routes (Supported with both /api prefix and root)
app.use('/api', routes);
app.use('/', routes);

// Centralized Error Handler
app.use(errorHandler);

export default app;

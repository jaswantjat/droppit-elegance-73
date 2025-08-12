import express from 'express';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://primary-production-903a.up.railway.app"],
    },
  },
}));

// Enable compression
app.use(compression());

// Enable CORS for the webhook endpoint
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://primary-production-903a.up.railway.app'] 
    : true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  res.json({
    webhookUrl: process.env.WEBHOOK_URL || 'https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23',
    maxFileSize: process.env.MAX_FILE_SIZE || '268435456', // 256MB in bytes
    maxFiles: process.env.MAX_FILES || '50',
    allowedTypes: (process.env.ALLOWED_TYPES || 'image/jpeg,image/jpg,image/png,image/webp,image/heic').split(',')
  });
});

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Webhook URL: ${process.env.WEBHOOK_URL || 'https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

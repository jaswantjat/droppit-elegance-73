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

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://primary-production-903a.up.railway.app']
    : true,
  credentials: true
}));

// Parse JSON bodies for JSON endpoints (multipart requests bypass this)
app.use(express.json());

// Upload proxy: forward multipart/form-data to upstream webhook and return its response
app.post('/upload', async (req, res) => {
  const upstream = process.env.WEBHOOK_URL || 'https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23';
  const timeoutMs = parseInt(process.env.UPLOAD_TIMEOUT_MS || '120000');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`📤 Proxying upload to: ${upstream}`);

    // Check if this is a batch upload by examining the request
    const contentType = req.headers['content-type'] || '';
    const isBatchUpload = contentType.includes('multipart/form-data');

    if (isBatchUpload) {
      console.log(`📦 Batch upload detected`);
    }

    const response = await fetch(upstream, {
      method: 'POST',
      // Forward content-type so boundary is preserved
      headers: {
        'content-type': contentType || 'application/octet-stream',
        'x-batch-upload': isBatchUpload ? 'true' : 'false', // Add batch indicator for webhook
        'idempotency-key': req.headers['idempotency-key'] || '', // ✅ Forward idempotency key
      },
      body: req as any,
      signal: controller.signal,
    });

    const responseContentType = response.headers.get('content-type') || 'application/json';
    res.status(response.status);
    res.setHeader('content-type', responseContentType);
    const text = await response.text();

    // For batch uploads, ensure we return a proper response format
    if (isBatchUpload && response.ok) {
      try {
        const parsedResponse = JSON.parse(text);
        // If the webhook doesn't return an array for batch uploads, create a compatible response
        if (!Array.isArray(parsedResponse.results) && !Array.isArray(parsedResponse.files)) {
          console.log(`📦 Converting single response to batch format`);
          // Create a results array for batch compatibility
          const results = [{
            success: true,
            url: parsedResponse.url || parsedResponse.file_url || parsedResponse.data?.url,
            index: 0
          }];
          res.json({ ...parsedResponse, results });
        } else {
          res.send(text);
        }
      } catch (parseError) {
        // If response is not JSON, send as-is
        res.send(text);
      }
    } else {
      res.send(text);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      res.status(504).json({ error: 'Upstream timeout', message: 'Upload timed out' });
    } else {
      res.status(502).json({ error: 'Upstream upload failed', message: err?.message || 'Unknown error' });
    }
  } finally {
    clearTimeout(timer);
  }
});

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
    // Point the client to our same-origin upload proxy for reliability
    webhookUrl: '/upload',
    maxFileSize: process.env.MAX_FILE_SIZE || '268435456', // 256MB in bytes
    maxFiles: process.env.MAX_FILES || '50',
    allowedTypes: (process.env.ALLOWED_TYPES || 'image/jpeg,image/jpg,image/png,image/webp,image/heic').split(','),
    enableBatching: process.env.ENABLE_BATCHING !== 'false', // Enable by default
    batchSize: parseInt(process.env.BATCH_SIZE || '5'), // Default batch size of 5
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
  console.log(`🔗 Upstream Webhook URL: ${process.env.WEBHOOK_URL || 'https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23'}`);
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

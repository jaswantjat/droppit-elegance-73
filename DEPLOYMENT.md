# Railway Deployment Guide

This guide will help you deploy the Bilingual Upload Interface to Railway.

## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push this code to a GitHub repository
3. **Webhook Endpoint**: Your existing webhook URL

## 🔧 Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the configuration

### 2. Set Environment Variables

In your Railway project dashboard, go to **Variables** and add:

```bash
# Required
NODE_ENV=production
WEBHOOK_URL=https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23

# Optional (with defaults)
MAX_FILE_SIZE=268435456
MAX_FILES=50
ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/webp,image/heic
```

### 3. Deploy

Railway will automatically:
1. Install dependencies
2. Build the React application
3. Start the Express server
4. Provide you with a public URL

## 🌐 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `WEBHOOK_URL` | Upload webhook endpoint | Your webhook URL |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `268435456` (256MB) |
| `MAX_FILES` | Maximum files per batch | `50` |
| `ALLOWED_TYPES` | Comma-separated file types | `image/jpeg,image/jpg,image/png,image/webp,image/heic` |

### Custom Domain (Optional)

1. Go to your Railway project
2. Click on "Settings"
3. Scroll to "Domains"
4. Add your custom domain
5. Update DNS records as instructed

## 🔍 Health Check

Your deployed application includes a health check endpoint:

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## 🛠️ Local Development

To run the production build locally:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
├── dist/                 # Built React application
├── src/                  # Source code
├── server.js            # Express production server
├── railway.json         # Railway configuration
├── Dockerfile          # Docker configuration (optional)
├── .railwayignore      # Files to ignore during deployment
└── package.json        # Dependencies and scripts
```

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure TypeScript compilation succeeds
- Verify environment variables are set

### Server Won't Start
- Check the Railway logs for error messages
- Verify the `PORT` environment variable
- Ensure the `dist` folder exists after build

### Upload Issues
- Verify the `WEBHOOK_URL` environment variable
- Check CORS configuration
- Ensure file size limits are appropriate

## 📊 Monitoring

Railway provides built-in monitoring:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Railway will automatically redeploy
3. Monitor the deployment in the Railway dashboard

## 🌍 Features

✅ **Bilingual Support**: Spanish (default) and English
✅ **File Upload**: Images only with size/type validation
✅ **Real-time Progress**: Upload progress with ETA
✅ **Queue Management**: Concurrent uploads with retry
✅ **Webhook Integration**: Direct posting to your endpoint
✅ **Responsive Design**: Works on all devices
✅ **Production Ready**: Optimized build with security headers

## 📞 Support

If you encounter issues:
1. Check the Railway logs
2. Verify environment variables
3. Test the webhook endpoint separately
4. Review the health check endpoint

Your application is now ready for production! 🎉

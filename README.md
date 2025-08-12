# Bilingual Upload Interface

A modern, robust file upload interface with bilingual support (Spanish/English) built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

### 🌍 **Bilingual Support**
- **Spanish (Default)** and English languages
- Persistent language preference
- Complete UI translation including error messages
- Easy language switching with dropdown menu

### 📤 **Robust File Upload**
- **Drag & Drop**: Intuitive file uploading with visual feedback
- **Real-time Progress**: Upload progress with ETA calculations
- **Queue Management**: Concurrent uploads (3 simultaneous) with retry functionality
- **File Validation**: Type and size validation with user-friendly error messages
- **Webhook Integration**: Direct posting to Railway webhook endpoint

### 🎨 **Modern UI**
- **Clean Interface**: No popups - direct page interface
- **Responsive Design**: Works seamlessly across all devices
- **Visual Feedback**: Status indicators, progress bars, and animations
- **Accessibility**: ARIA labels and keyboard navigation

### 🔧 **Technical Features**
- **File Types**: Images only (JPG, JPEG, PNG, WebP, HEIC)
- **File Limits**: 50 files per batch, 256MB per file
- **Progress Tracking**: XMLHttpRequest with true upload progress
- **Error Handling**: Comprehensive error handling with retry mechanism
- **Production Ready**: Optimized build with security headers

## 🚀 Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/jaswantjat/droppit-elegance-73.git
cd droppit-elegance-73

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment

### Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Set Environment Variables**:
   ```bash
   NODE_ENV=production
   WEBHOOK_URL=https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23
   ```
3. **Deploy**: Railway automatically builds and deploys

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Internationalization**: Custom i18n system with React Context
- **File Handling**: Axios with upload progress tracking
- **Backend**: Express.js server for production
- **State Management**: React hooks and context
- **Icons**: Lucide React

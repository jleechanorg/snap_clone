# 🚀 Google Cloud Platform Deployment Guide

## Prerequisites ✅

- Google Cloud CLI installed and configured ✅ (Already installed!)
- GCP project with billing enabled
- Cloud Run API enabled
- Artifact Registry API enabled

## 🔑 One-Time Persistent Authentication Setup

Run this **once** to set up authentication that survives reboots:

```bash
# From the snap_clone root directory
./setup-persistent-auth.sh
```

This script will:
- ✅ Verify your current gcloud authentication
- ✅ Set up Application Default Credentials (persists across reboots)
- ✅ Configure project settings automatically  
- ✅ Enable required Google Cloud APIs
- ✅ Test deployment access

## 🚀 Deploy Anytime (No Re-authentication Needed)

After running the setup script once, you can deploy anytime:

```bash
# From the snap_clone root directory
./deploy.sh
```

**Even after restarting your computer**, this will work without any authentication prompts!

## What the Deployment Includes 🎯

### **Enhanced Snapchat Clone Features:**
- ✅ **Video Playback**: Enhanced 8-method video URL extraction system
- ✅ **Visual Styling**: Dynamic gradients, enhanced shadows, smooth animations
- ✅ **UX Improvements**: 80% viewport modals, keyboard shortcuts, mobile responsiveness
- ✅ **SPA Navigation**: Proper React navigation without page reloads
- ✅ **Code Quality**: ESLint compliant, utility functions, accessibility features

### **Production Infrastructure:**
- **Docker Multi-stage Build**: Optimized for production with nginx
- **Cloud Run Service**: Serverless, auto-scaling deployment
- **Artifact Registry**: Secure container image storage
- **CORS Proxy**: Nginx proxy for Snapchat API requests (`/snap/*` → `snapchat.com`)
- **Performance Optimizations**: Gzip compression, asset caching, SPA routing

### **Configuration Details:**
- **Service Name**: `snap-clone-dev`
- **Region**: `us-central1` 
- **Memory**: `512Mi`
- **Port**: `80`
- **Public Access**: Unauthenticated (allows public demo)

## Expected Deployment Output 📊

```bash
✅ Service deployed successfully at: https://snap-clone-dev-[hash]-uc.a.run.app
```

## Testing the Deployment 🧪

Once deployed, test with:
```bash
# Example URL (replace with your actual service URL)
https://your-service-url.run.app/?username=moonlightbae
```

### **Key Features to Test:**
1. **Profile Loading**: Enter `?username=moonlightbae` 
2. **Video Playback**: Click Spotlight content to see enhanced video player
3. **Modal Navigation**: Test keyboard shortcuts (Space, Esc, Arrow keys)
4. **Mobile Responsiveness**: Test on different screen sizes
5. **SPA Navigation**: Profile links should navigate smoothly without page reload

## Troubleshooting 🔧

### **Common Issues:**

1. **Project Not Set**: 
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **APIs Not Enabled**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
   ```

3. **Permissions Issues**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

4. **Build Fails**:
   - Check `client/package.json` dependencies
   - Verify `client/Dockerfile` syntax
   - Review build logs in GCP Console

### **Monitoring and Logs:**
```bash
# View service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=snap-clone-dev" --limit=50

# View service details  
gcloud run services describe snap-clone-dev --platform managed --region us-central1
```

## Architecture Overview 🏗️

```
User Request → Cloud Run (nginx) → React App
                    ↓
              /snap/* requests → Proxy to snapchat.com
```

### **Production Features:**
- **Automatic HTTPS**: Cloud Run provides SSL certificates
- **Global CDN**: Static assets served via Google's CDN
- **Auto-scaling**: Scales to zero when not in use
- **Health Checks**: Automatic container health monitoring
- **Rolling Updates**: Zero-downtime deployments

## Cost Optimization 💰

- **Pay-per-request**: Only charged when the service receives requests
- **Scales to zero**: No charges during idle periods
- **Efficient caching**: Reduces redundant API calls
- **Optimized builds**: Multi-stage Docker builds minimize image size

---

🎉 **Ready to deploy your enhanced Snapchat clone with video playback, sophisticated UX, and production-grade infrastructure!**
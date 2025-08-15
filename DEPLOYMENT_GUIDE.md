# GCP Deployment Guide

## Prerequisites Setup

### 1. Authenticate with Google Cloud
You need to complete the gcloud authentication manually:

```bash
# Authenticate your gcloud CLI
gcloud auth login

# Follow the browser prompts and enter the verification code when prompted
```

### 2. Set up your GCP Project
```bash
# Create a new project (optional)
gcloud projects create your-project-id --name="Snapchat Clone"

# Or list existing projects
gcloud projects list

# Set the active project
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Required APIs
```bash
# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Run API  
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com
```

## Deployment

### Option 1: Deploy to dev environment
```bash
./deploy.sh client
```

### Option 2: Deploy to stable environment
```bash
./deploy.sh client stable
```

## Post-Deployment

### Check deployment status
```bash
# List Cloud Run services
gcloud run services list

# Get service details
gcloud run services describe client-snap-clone-dev --region=us-central1
```

### Access your application
The deployment script will output the service URL at the end. It will look like:
```
https://client-snap-clone-dev-[hash]-uc.a.run.app
```

## Troubleshooting

### If authentication fails:
1. Make sure you have a Google Cloud account
2. Ensure you have the necessary permissions for the project
3. Try `gcloud auth list` to see current authenticated accounts

### If deployment fails:
1. Check that all APIs are enabled
2. Verify you have sufficient quota
3. Check Cloud Build logs: `gcloud builds list`

### If the app doesn't load:
1. Check Cloud Run logs: `gcloud run services logs read client-snap-clone-dev`
2. Verify the Dockerfile builds locally: `docker build client/`
3. Test nginx config locally

## Configuration

### Environment Variables
To add environment variables to your Cloud Run service:
```bash
gcloud run services update client-snap-clone-dev \
  --set-env-vars="VITE_API_URL=https://your-api.com"
```

### Custom Domain
To map a custom domain:
```bash
gcloud run domain-mappings create \
  --service=client-snap-clone-dev \
  --domain=your-domain.com
```
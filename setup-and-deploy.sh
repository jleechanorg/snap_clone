#!/bin/bash
set -e

echo "=== GCP Setup and Deployment Script ==="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "You need to authenticate with Google Cloud first."
    echo "Run: gcloud auth login"
    echo "Then set your project: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Check if project is set
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "No project is set. Please run:"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Using project: $PROJECT_ID"
echo ""

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com  
gcloud services enable containerregistry.googleapis.com

echo "APIs enabled successfully!"
echo ""

# Run the deployment
echo "Starting deployment..."
./deploy.sh client

echo ""
echo "=== Deployment Complete ==="
echo "Your app should be accessible at the URL shown above."
echo ""
echo "To check status: gcloud run services list"
echo "To view logs: gcloud run services logs read client-snap-clone-dev"
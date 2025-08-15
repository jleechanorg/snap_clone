#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="snap-clone-dev"
REPO_NAME="${REPO_NAME:-snap-clone-repo}"
REGION="us-central1"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/snap-clone:latest"

# Validate prerequisites
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

if [ ! -d "client" ]; then
    echo "Error: 'client' directory does not exist in the current working directory."
    exit 1
fi

# Check if the Artifact Registry repository exists, create if not
echo "Checking Artifact Registry repository..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Artifact Registry repository '$REPO_NAME' not found. Creating..."
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for snap-clone"
fi

echo "Building and deploying to Cloud Run..."

cd client
gcloud builds submit . --tag "$IMAGE_TAG"

if [ $? -ne 0 ]; then
    echo "Build failed. Aborting deployment."
    exit 1
fi

gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --platform managed \
    --region="$REGION" \
    --allow-unauthenticated \
    --memory=512Mi \
    --port=80

if [ $? -ne 0 ]; then
    echo "Deployment failed. Aborting."
    exit 1
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region="$REGION" --format 'value(status.url)')
if [ -z "$SERVICE_URL" ]; then
    echo "Failed to retrieve service URL. Deployment may not have succeeded."
    exit 1
fi

echo "✅ Service deployed successfully at: $SERVICE_URL"
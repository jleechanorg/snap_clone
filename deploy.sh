#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="snap-clone-dev"
IMAGE_TAG="us-central1-docker.pkg.dev/$PROJECT_ID/snap-clone-repo/snap-clone:latest"

echo "Building and deploying to Cloud Run..."

cd client
gcloud builds submit . --tag "$IMAGE_TAG"

gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --platform managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --memory=512Mi \
    --port=80

gcloud run services describe "$SERVICE_NAME" --platform managed --region=us-central1 --format 'value(status.url)'
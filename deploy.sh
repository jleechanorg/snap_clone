#!/bin/bash
set -e

# --- Argument Parsing & Directory Logic ---
TARGET_DIR=""
ENVIRONMENT="dev" # Default environment

# --- THIS IS THE NEW CONTEXT-AWARE LOGIC ---
# First, check if the CURRENT directory has a Dockerfile.
if [ -f "./Dockerfile" ]; then
    # If so, we've found our target.
    TARGET_DIR="."
    # Check if an argument was provided, and if so, assume it's the environment.
    if [[ "$1" == "stable" ]]; then
        ENVIRONMENT="stable"
    fi
else
    # The current directory is not a deployable app.
    # Check if the first argument is a valid directory.
    if [ -d "$1" ]; then
        TARGET_DIR="$1"
        # Check if the second argument is the environment.
        if [[ "$2" == "stable" ]]; then
            ENVIRONMENT="stable"
        fi
    fi
fi

# If TARGET_DIR is still empty after all checks, show the interactive menu.
if [ -z "$TARGET_DIR" ]; then
    echo "No app auto-detected. Please choose an app to deploy:"
    apps=($(find . -maxdepth 2 -type f -name "Dockerfile" -printf "%h\n" | sed 's|./||' | sort))
    if [ ${#apps[@]} -eq 0 ]; then
        echo "No apps with a Dockerfile found."
        exit 1
    fi
    select app in "${apps[@]}"; do
        if [[ -n $app ]]; then
            TARGET_DIR=$app
            # After selection, check if an argument was passed for the environment
            if [[ "$1" == "stable" ]]; then
                ENVIRONMENT="stable"
            fi
            break
        else
            echo "Invalid selection. Please try again."
        fi
    done
fi

# --- Final Check & Configuration ---
echo "--- Deployment Details ---"
echo "Target Directory: $TARGET_DIR"
echo "Environment:      $ENVIRONMENT"
echo "--------------------------"

if [ ! -f "$TARGET_DIR/Dockerfile" ]; then
    echo "Error: No Dockerfile found in '$TARGET_DIR'."
    exit 1
fi

BASE_SERVICE_NAME=$(basename $(realpath "$TARGET_DIR") | tr '_' '-')-snap-clone
SERVICE_NAME="$BASE_SERVICE_NAME-$ENVIRONMENT"
PROJECT_ID=$(gcloud config get-value project)

echo "--- Preparing to deploy service '$SERVICE_NAME' to project '$PROJECT_ID' ---"

# --- Build Step ---
IMAGE_TAG="us-central1-docker.pkg.dev/$PROJECT_ID/snap-clone-repo/$BASE_SERVICE_NAME:$ENVIRONMENT-latest"
echo "Building container image from '$TARGET_DIR' with tag '$IMAGE_TAG'..."

# For the client app, we don't need to copy additional directories like the original script
# The Dockerfile handles everything needed for the React app

(cd "$TARGET_DIR" && gcloud builds submit . --tag "$IMAGE_TAG")

# --- Deploy Step ---
echo "Deploying to Cloud Run as service '$SERVICE_NAME'..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --platform managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --memory=512Mi \
    --timeout=60 \
    --min-instances=0 \
    --max-instances=5 \
    --concurrency=80 \
    --port=80

echo "--- Deployment of '$SERVICE_NAME' complete. ---"

# Configure load balancer timeout to match service timeout
echo "Configuring load balancer timeout..."
gcloud run services update "$SERVICE_NAME" \
    --platform managed \
    --region=us-central1 \
    --timeout=60

gcloud run services describe "$SERVICE_NAME" --platform managed --region=us-central1 --format 'value(status.url)'
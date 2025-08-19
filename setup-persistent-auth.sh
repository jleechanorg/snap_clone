#!/bin/bash
set -e

echo "🔑 Setting up persistent Google Cloud authentication..."

# Check if already authenticated
if gcloud auth list --format="value(account)" --filter="status:ACTIVE" | grep -q "@"; then
    echo "✅ Already authenticated with gcloud"
    CURRENT_ACCOUNT=$(gcloud auth list --format="value(account)" --filter="status:ACTIVE")
    echo "   Active account: $CURRENT_ACCOUNT"
else
    echo "❌ Not authenticated with gcloud"
    echo "   Please run: gcloud auth login"
    exit 1
fi

# Check if project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ No project set"
    echo "   Setting project to: worldarchitecture-ai"
    gcloud config set project worldarchitecture-ai
else
    echo "✅ Project set to: $CURRENT_PROJECT"
fi

# Set up Application Default Credentials if not exists
ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"
if [ ! -f "$ADC_FILE" ]; then
    echo "⚙️  Setting up Application Default Credentials..."
    echo "   This will open a browser window - please complete the authentication"
    echo "   Press Enter to continue..."
    read -r
    
    gcloud auth application-default login
    
    if [ -f "$ADC_FILE" ]; then
        echo "✅ Application Default Credentials created"
    else
        echo "❌ Failed to create Application Default Credentials"
        exit 1
    fi
else
    echo "✅ Application Default Credentials already exist"
fi

# Test authentication
echo "🧪 Testing authentication..."
if gcloud projects list --limit=1 >/dev/null 2>&1; then
    echo "✅ Authentication test successful"
else
    echo "❌ Authentication test failed"
    exit 1
fi

# Test deployment
echo "🧪 Testing deployment command..."
if gcloud run services list --platform managed --region us-central1 >/dev/null 2>&1; then
    echo "✅ Deployment access confirmed"
else
    echo "❌ Deployment access failed - enabling Cloud Run API..."
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    echo "✅ APIs enabled"
fi

echo ""
echo "🎉 Persistent authentication setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Google Cloud SDK in PATH (via bashrc)"
echo "   ✅ Account authenticated: $(gcloud config get-value account)"
echo "   ✅ Project set: $(gcloud config get-value project)"
echo "   ✅ Application Default Credentials: $ADC_FILE"
echo "   ✅ Required APIs enabled"
echo ""
echo "🚀 You can now run ./deploy.sh anytime without re-authentication!"
echo "   Even after restarting your computer, authentication will persist."
echo ""
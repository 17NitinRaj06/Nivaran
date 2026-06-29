# Google Cloud Deployment Guide

## Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed and configured
- Docker installed
- Firebase Admin SDK service account key

## Step 1: Build and Deploy Backend (Cloud Run)

```bash
# Set your GCP project
export PROJECT_ID="nivaran-4df36"

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create nivaran --repository-format=docker \
  --location=us-central1

# Build and deploy using Cloud Build
cd backend
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="your-key",_FIREBASE_PROJECT_ID="$PROJECT_ID",_FIREBASE_CLIENT_EMAIL="your-client-email",_FIREBASE_PRIVATE_KEY="your-private-key",_CLOUDINARY_CLOUD_NAME="your-cloud-name",_CLOUDINARY_API_KEY="your-api-key",_CLOUDINARY_API_SECRET="your-secret",_FRONTEND_URL="https://nivaran-frontend-xxxxx-uc.a.run.app"
```

## Step 2: Build and Deploy Frontend (Cloud Run)

```bash
cd frontend

# Update .env with production API URL
echo "VITE_API_URL=https://nivaran-api-xxxxx-uc.a.run.app/api" >> .env

# Build and deploy
gcloud builds submit --config=cloudbuild.yaml
```

## Step 3: Verify Deployments

```bash
# Get backend URL
gcloud run services describe nivaran-api --region=us-central1 --format='value(status.url)'

# Get frontend URL
gcloud run services describe nivaran-frontend --region=us-central1 --format='value(status.url)'

# Test health endpoint
curl https://nivaran-api-xxxxx-uc.a.run.app/api/health
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend URL for CORS |

## Google AI Studio Usage

This project uses Google AI Studio (Gemini API) for:
1. **Image Analysis** - Automatic categorization and description of civic issues from photos
2. **Description Generation** - AI-powered report descriptions
3. **Resolution Suggestions** - AI-generated resolution plans for officers
4. **Smart Assignment** - AI-powered officer and department recommendations
5. **Predictive Insights** - Forecasting and trend analysis

The Gemini model `gemini-1.5-flash` is used for all AI features.

#!/usr/bin/env bash
set -e

# ==============================================================================
# Catatin Application - Google Cloud Run & Cloud SQL (MySQL) Deployment Script
# Target: Google Cloud Run (Serverless Next.js) + Cloud SQL (MySQL 8.0)
# Secrets: Google Secret Manager
# Usage: ./deploy-cloudrun.sh [GCP_PROJECT_ID] [GCP_REGION]
# ==============================================================================

GCP_PROJECT_ID="${1:-${GCP_PROJECT_ID}}"
GCP_REGION="${2:-${GCP_REGION:-asia-southeast2}}"
SERVICE_NAME="catatin"
SQL_INSTANCE_NAME="catatin-mysql"
MYSQL_DB_NAME="catatin_db"
MYSQL_USER="catatin_user"

echo "======================================================"
echo " ☁️ Catatin Application - Google Cloud Run & Cloud SQL Deployment"
echo " Region: ${GCP_REGION} | Database: Cloud SQL MySQL 8.0"
echo "======================================================"

# 1. Verify gcloud CLI
if ! command -v gcloud >/dev/null 2>&1; then
    echo "❌ Error: gcloud CLI is not installed!"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 2. Get GCP Project ID if not supplied
if [ -z "$GCP_PROJECT_ID" ]; then
    GCP_PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
    if [ -z "$GCP_PROJECT_ID" ] || [ "$GCP_PROJECT_ID" = "(unset)" ]; then
        echo "❌ Error: GCP_PROJECT_ID is not set!"
        echo "Usage: ./deploy-cloudrun.sh <YOUR_GCP_PROJECT_ID> [REGION]"
        exit 1
    fi
fi

echo "📌 Using GCP Project ID: ${GCP_PROJECT_ID}"
echo "📌 Using GCP Region:     ${GCP_REGION}"

gcloud config set project "${GCP_PROJECT_ID}" --quiet

# 3. Enable Required Google Cloud APIs
echo "🔑 Enabling required GCP Service APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    --quiet

# 4. Read .env.prod for local secret population if needed
ENV_PROD_FILE=".env.prod"
if [ ! -f "$ENV_PROD_FILE" ]; then
    if [ -f ".env.prod.example" ]; then
        echo "⚠️ .env.prod file not found. Copying from .env.prod.example..."
        cp .env.prod.example .env.prod
    fi
fi

if [ -f "$ENV_PROD_FILE" ]; then
    set -a
    . "$ENV_PROD_FILE"
    set +a
fi

# 5. Check or Create Cloud SQL Instance
echo "🗄️ Checking Cloud SQL MySQL Instance '${SQL_INSTANCE_NAME}'..."
if ! gcloud sql instances describe "${SQL_INSTANCE_NAME}" --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    echo "🚀 Creating Cloud SQL MySQL instance '${SQL_INSTANCE_NAME}' (db-f1-micro) in ${GCP_REGION}..."
    MYSQL_ROOT_PASS="${MYSQL_ROOT_PASSWORD:-RootPass_Catatin_2026}"
    gcloud sql instances create "${SQL_INSTANCE_NAME}" \
        --database-version=MYSQL_8_0 \
        --tier=db-f1-micro \
        --region="${GCP_REGION}" \
        --root-password="${MYSQL_ROOT_PASS}" \
        --project="${GCP_PROJECT_ID}"
else
    echo "✅ Cloud SQL Instance '${SQL_INSTANCE_NAME}' exists."
fi

# Wait for Cloud SQL Instance to be in RUNNING state
echo "⏳ Waiting for Cloud SQL Instance '${SQL_INSTANCE_NAME}' to reach RUNNING state..."
while true; do
    INSTANCE_STATE=$(gcloud sql instances describe "${SQL_INSTANCE_NAME}" --project="${GCP_PROJECT_ID}" --format="value(state)" 2>/dev/null || echo "UNKNOWN")
    if [ "$INSTANCE_STATE" = "RUNNABLE" ] || [ "$INSTANCE_STATE" = "RUNNING" ]; then
        echo "✅ Cloud SQL Instance is ready (${INSTANCE_STATE})!"
        break
    fi
    echo "  Current state: ${INSTANCE_STATE}. Waiting 10 seconds..."
    sleep 10
done

# 6. Ensure Database & User exist in Cloud SQL
echo "🗄️ Checking Database '${MYSQL_DB_NAME}' in Cloud SQL..."
if ! gcloud sql databases describe "${MYSQL_DB_NAME}" --instance="${SQL_INSTANCE_NAME}" >/dev/null 2>&1; then
    echo "Creating database '${MYSQL_DB_NAME}'..."
    gcloud sql databases create "${MYSQL_DB_NAME}" --instance="${SQL_INSTANCE_NAME}"
fi

echo "👤 Checking User '${MYSQL_USER}' in Cloud SQL..."
MYSQL_USER_PASS="${MYSQL_PASSWORD:-CatatinUserPass_2026}"
gcloud sql users create "${MYSQL_USER}" --instance="${SQL_INSTANCE_NAME}" --password="${MYSQL_USER_PASS}" 2>/dev/null || \
gcloud sql users set-password "${MYSQL_USER}" --instance="${SQL_INSTANCE_NAME}" --password="${MYSQL_USER_PASS}"

# Database URL for Cloud Run -> Cloud SQL MySQL
CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${SQL_INSTANCE_NAME}"
CLOUD_SQL_DB_URL="mysql://${MYSQL_USER}:${MYSQL_USER_PASS}@34.128.125.53:3306/${MYSQL_DB_NAME}"

# 7. Ensure Secrets in Secret Manager
create_or_update_secret() {
    SECRET_NAME="$1"
    SECRET_VAL="$2"
    if [ -z "$SECRET_VAL" ]; then
        SECRET_VAL="placeholder_value"
    fi

    if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
        echo "🔒 Creating secret '$SECRET_NAME' in Secret Manager..."
        gcloud secrets create "$SECRET_NAME" --replication-policy="automatic"
    fi
    echo -n "$SECRET_VAL" | gcloud secrets versions add "$SECRET_NAME" --data-file=- >/dev/null
}

AI_KEY="${VERTEX_API_KEY:-${GEMMA_API_KEY:-${GEMINI_API_KEY}}}"

echo "🔒 Syncing secrets to Secret Manager..."
create_or_update_secret "catatin-db-url" "$CLOUD_SQL_DB_URL"
create_or_update_secret "catatin-gemma-key" "${AI_KEY}"
create_or_update_secret "catatin-google-client-email" "${GOOGLE_CLIENT_EMAIL}"
create_or_update_secret "catatin-google-private-key" "${GOOGLE_PRIVATE_KEY}"
create_or_update_secret "catatin-google-sheet-id" "${GOOGLE_SPREADSHEET_ID}"

# Grant Secret Manager Secret Accessor role & Vertex AI role to Cloud Run default service account
PROJECT_NUMBER=$(gcloud projects describe "${GCP_PROJECT_ID}" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "🔐 Granting permissions to Service Account ${COMPUTE_SA}..."
(
  for SECRET in catatin-db-url catatin-gemma-key catatin-google-client-email catatin-google-private-key catatin-google-sheet-id; do
      gcloud secrets add-iam-policy-binding "$SECRET" \
          --member="serviceAccount:${COMPUTE_SA}" \
          --role="roles/secretmanager.secretAccessor" --quiet >/dev/null 2>&1 &
  done
  gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
      --member="serviceAccount:${COMPUTE_SA}" \
      --role="roles/aiplatform.user" --quiet >/dev/null 2>&1 &
  wait
)

# 8. Build Container Image via Cloud Build
IMAGE_TAG="gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}:latest"
echo "🏗️ Building container image via Cloud Build: ${IMAGE_TAG}..."
gcloud builds submit --tag "${IMAGE_TAG}" .

# 9. Deploy to Google Cloud Run
echo "🚀 Deploying to Cloud Run service '${SERVICE_NAME}'..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_TAG}" \
    --region "${GCP_REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --add-cloudsql-instances "${CONNECTION_NAME}" \
    --set-secrets "DATABASE_URL=catatin-db-url:latest,GEMMA_API_KEY=catatin-gemma-key:latest,VERTEX_API_KEY=catatin-gemma-key:latest,GOOGLE_CLIENT_EMAIL=catatin-google-client-email:latest,GOOGLE_PRIVATE_KEY=catatin-google-private-key:latest,GOOGLE_SPREADSHEET_ID=catatin-google-sheet-id:latest" \
    --project "${GCP_PROJECT_ID}"

# 10. Get Service URL and Health Check
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${GCP_REGION}" --format="value(status.url)")

echo "======================================================"
echo " 🎉 Deployment to Google Cloud Run Succeeded!"
echo " 🌐 Service URL: ${SERVICE_URL}"
echo "======================================================"

echo "🔍 Running Health Check..."
if curl -f "${SERVICE_URL}" >/dev/null 2>&1; then
    echo "✅ Health check PASSED! Catatin Application is live at ${SERVICE_URL}"
else
    echo "⚠️ Health check warning: Could not verify HTTP 200, please check logs with:"
    echo "   gcloud run logs read --service=${SERVICE_NAME} --region=${GCP_REGION}"
fi

---
name: google-agents-cli-deploy
description: How to deploy ADK agents to Google Cloud Run, Agent Runtime, GKE, CI/CD, and secrets management.
---

# Skill: Agent Deployment & Cloud Run

This skill governs containerizing and deploying ADK agents to Google Cloud.

## Guidelines
1. **Container & Environment**:
   - Ensure environment variables (`GEMMA_API_KEY`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`, `DATABASE_URL`) are stored in Google Secret Manager or passed via Cloud Run env.
2. **Cloud Run Deployment**:
   - Command: `agents-cli deploy --target cloudrun --region asia-southeast1`
   - Config: Enable auto-scaling, set minimum instances if zero-cold-start is required.
3. **CI/CD Integration**:
   - Run `agents-cli lint` and `agents-cli eval` in pipeline before deployment.

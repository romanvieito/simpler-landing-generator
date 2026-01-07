#!/usr/bin/env bash
set -euo pipefail

# One-time helper to create a dedicated Vercel project for published static landings.
# This is meant to be run on YOUR machine (not inside Vercel).
#
# Usage:
#   VERCEL_PUBLISH_PROJECT="simpler-published-sites" ./scripts/vercel-setup-publish-project.sh
#
# Notes:
# - This script uses Vercel CLI (`npx vercel@latest`).
# - You may be prompted to log in / select team.
# - Deployment Protection cannot reliably be toggled via CLI; you may need to disable it once in the dashboard:
#   Project → Settings → Deployment Protection → None (and ensure Vercel Authentication is disabled)

PROJECT_NAME="${VERCEL_PUBLISH_PROJECT:-}"
if [[ -z "${PROJECT_NAME}" ]]; then
  echo "Missing VERCEL_PUBLISH_PROJECT env var."
  echo "Example: VERCEL_PUBLISH_PROJECT=\"simpler-published-sites\" ./scripts/vercel-setup-publish-project.sh"
  exit 1
fi

echo "Using publish project: ${PROJECT_NAME}"
echo "Ensuring Vercel CLI is available..."
npx --yes vercel@latest --version >/dev/null

echo "Creating project if it does not exist (no-op if it already exists)..."
# `vercel projects add` exists on current CLI; if your CLI differs, you can create the project in the dashboard instead.
npx --yes vercel@latest projects add "${PROJECT_NAME}" || true

echo
echo "Next steps (manual, one time):"
echo "- Open the Vercel project \"${PROJECT_NAME}\" in the dashboard."
echo "- Go to Settings → Deployment Protection."
echo "- Set protection to \"None\" and ensure \"Vercel Authentication\" is disabled."
echo
echo "Then set VERCEL_PUBLISH_PROJECT=\"${PROJECT_NAME}\" in your app environment and republish."



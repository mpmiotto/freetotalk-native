#!/bin/bash

# Script to push updated EAS build workflow files to GitHub repository

echo "===== Pushing updated EAS workflow files to GitHub ====="
echo "==================================================="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check for GitHub token
if [[ -z "$GITHUB_TOKEN" ]]; then
  echo "⚠️ Error: GITHUB_TOKEN environment variable not set"
  echo "Please set it with: export GITHUB_TOKEN=your_github_token"
  exit 1
fi

# Files to push
FILES_TO_PUSH=(
  "update-build-numbers.js"
  "full-build-and-submit.sh"
  "auto-submit-build.sh"
  ".github/workflows/expo-build.yml"
  "EAS_WORKFLOW_README.md"
)

# Repository info
REPO_OWNER="mmiotto"
REPO_NAME="imfree"
BRANCH="main"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Clone the repository (shallow clone for speed)
git clone --depth 1 https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git $TEMP_DIR

# Create necessary directories
mkdir -p "$TEMP_DIR/expo-webview-app/.github/workflows"

# Copy files
for file in "${FILES_TO_PUSH[@]}"; do
  echo "📋 Copying $file"
  mkdir -p "$(dirname "$TEMP_DIR/expo-webview-app/$file")"
  cp -f "$file" "$TEMP_DIR/expo-webview-app/$file"
done

# Configure git
cd $TEMP_DIR
git config user.name "Workflow Bot"
git config user.email "bot@example.com"

# Add, commit, and push
git add .
git commit -m "Update EAS build workflow for auto-submit"
git push origin $BRANCH

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed workflow files to GitHub"
else
  echo "❌ Failed to push to GitHub"
  exit 1
fi

echo "==================================================="
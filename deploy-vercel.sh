#!/bin/bash

# Production Deployment Script for Shades Web App
# This script handles the build and deployment process for Vercel

# Set environment variables
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096" # Increase memory limit for Node.js

# Verify MongoDB connection string is available
if [ -z "$MONGODB_URI" ]; then
  echo "Warning: MONGODB_URI environment variable is not set."
  echo "Using the one from .env.local or vercel.json"
fi

# Clean up any previous builds
echo "Cleaning up previous builds..."
rm -rf .next
rm -rf out

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "Build successful! Deploying to Vercel..."

  # Deploy to Vercel
  npx vercel deploy --prod --yes

  echo "Deployment complete!"
else
  echo "Build failed. Please check the errors above."
  exit 1
fi

exit 0

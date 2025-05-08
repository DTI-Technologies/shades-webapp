#!/bin/bash

# Deployment script for Shades Web App

echo "=== Deploying Shades Web App to Vercel ==="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "Building application..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment completed!"

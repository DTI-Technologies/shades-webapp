#!/bin/bash

# This script is used by Vercel to build the project
# It skips the static generation of pages that fetch data

# Set environment variables
export NEXT_TELEMETRY_DISABLED=1
export VERCEL=true

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
NEXT_PUBLIC_SKIP_API_CALLS=true npm run build

# Exit with success
exit 0

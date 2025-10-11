#!/bin/bash

# YolNet Backend Production Start Script

echo "🚀 Starting YolNet Backend Production Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with production configuration"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Create necessary directories
mkdir -p uploads logs

# Start the production server
echo "🔥 Starting production server..."
npm start


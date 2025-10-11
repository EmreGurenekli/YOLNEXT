#!/bin/bash

# YolNet Backend Development Start Script

echo "🚀 Starting YolNet Backend Development Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
mkdir -p uploads logs

# Start the development server
echo "🔥 Starting development server..."
npm run dev


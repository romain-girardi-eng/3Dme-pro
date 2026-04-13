#!/bin/bash
# 3Dme - Standalone Launch Script

cd "$(dirname "$0")/frontend"

echo "🚀 Starting 3Dme..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start on port 5176 to avoid conflicts
PORT=5176 npm run dev

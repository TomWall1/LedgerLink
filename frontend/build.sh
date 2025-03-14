#!/bin/bash
echo "Starting build process..."
cd frontend
npm install
NODE_ENV=production npm run build
echo "Build completed!"

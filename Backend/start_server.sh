#!/bin/bash

# Start the Catapult backend API server

# Set up environment
echo "Setting up environment..."
if [ -f .env ]; then
    echo "Found .env file, loading environment variables"
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found, using default environment"
fi

# Check for Python
if command -v python3 &>/dev/null; then
    PYTHON=python3
elif command -v python &>/dev/null; then
    PYTHON=python
else
    echo "Python not found. Please install Python 3."
    exit 1
fi

# Check for required packages
echo "Checking required packages..."
$PYTHON -m pip install -r requirements.txt

# Start the server
echo "Starting Catapult API server..."
$PYTHON api.py

# This part will only execute if the server exits
echo "Server exited. Check logs for details." 
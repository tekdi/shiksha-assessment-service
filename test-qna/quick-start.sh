#!/bin/bash

# Test Report Generator - Quick Start Script
# This script will set up the project and run it with your test ID

echo "🚀 Test Report Generator - Quick Start"
echo "======================================"

# Check if test ID is provided
if [ -z "$1" ]; then
    echo "❌ Error: Test ID is required!"
    echo "Usage: ./quick-start.sh <test-id>"
    echo "Example: ./quick-start.sh 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd"
    exit 1
fi

TEST_ID=$1
echo "📋 Test ID: $TEST_ID"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js (v16 or higher) first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed!"
    echo "Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies!"
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env file with your database credentials before running!"
    echo "   - DB_HOST: Your database host"
    echo "   - DB_PORT: Your database port (usually 5432)"
    echo "   - DB_NAME: Your database name"
    echo "   - DB_USER: Your database username"
    echo "   - DB_PASSWORD: Your database password"
    echo ""
    echo "After editing .env, run this script again."
    exit 0
fi

echo "✅ .env file found!"

# Check if TypeScript and ts-node are available
if ! command -v ts-node &> /dev/null; then
    echo "📦 Installing TypeScript and ts-node globally..."
    npm install -g typescript ts-node
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install TypeScript globally!"
        echo "Trying to run with local installation..."
        npx ts-node test-report-generator.ts "$TEST_ID"
    else
        echo "✅ TypeScript and ts-node installed globally!"
    fi
fi

# Run the report generator
echo "🚀 Running Test Report Generator..."
echo "📊 Generating report for test: $TEST_ID"
echo ""

if command -v ts-node &> /dev/null; then
    ts-node test-report-generator.ts "$TEST_ID"
else
    npx ts-node test-report-generator.ts "$TEST_ID"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Report generation completed successfully!"
    echo "📁 Check the generated test-report.csv file in the current directory."
else
    echo ""
    echo "❌ Report generation failed!"
    echo "Please check the error messages above and try again."
fi 
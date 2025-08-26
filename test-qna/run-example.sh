#!/bin/bash

# Example script showing how to run the Test Report Generator
# Replace the test ID with your actual test ID

echo "📚 Test Report Generator - Usage Examples"
echo "========================================="
echo ""

# Example test ID - REPLACE THIS WITH YOUR ACTUAL TEST ID
EXAMPLE_TEST_ID="1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd"

echo "🔍 Example Test ID: $EXAMPLE_TEST_ID"
echo ""

echo "📋 Available Commands:"
echo "======================"
echo ""

echo "1️⃣  Quick Start (Recommended):"
echo "   ./quick-start.sh $EXAMPLE_TEST_ID"
echo ""

echo "2️⃣  Direct TypeScript execution:"
echo "   ts-node test-report-generator.ts $EXAMPLE_TEST_ID"
echo ""

echo "3️⃣  Using npm script:"
echo "   npm run generate -- $EXAMPLE_TEST_ID"
echo ""

echo "4️⃣  Build and run JavaScript:"
echo "   npm run build"
echo "   node dist/test-report-generator.js $EXAMPLE_TEST_ID"
echo ""

echo "5️⃣  Using npx (if ts-node not installed globally):"
echo "   npx ts-node test-report-generator.ts $EXAMPLE_TEST_ID"
echo ""

echo "⚠️   Important Notes:"
echo "===================="
echo "• Make sure you have edited the .env file with your database credentials"
echo "• Ensure your PostgreSQL database is running and accessible"
echo "• The script will generate test-report.csv in the current directory"
echo ""

echo "🚀 Ready to run? Choose one of the commands above!"
echo "   Start with: ./quick-start.sh $EXAMPLE_TEST_ID" 
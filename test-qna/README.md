# Test Report Generator

A TypeScript script to generate comprehensive test reports from the assessment database with dynamic question columns.

## Features

- ✅ **Dynamic Columns**: Automatically generates columns for each question
- ✅ **Question Text Headers**: Uses actual question text as column headers
- ✅ **User Rows**: Each user who took the test becomes a row
- ✅ **CSV Export**: Generates CSV files ready for Excel/Google Sheets
- ✅ **Flexible**: Works with any number of questions
- ✅ **Standalone**: Runs independently without external dependencies

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database access
- TypeScript and ts-node (will be installed automatically)

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd test-qna
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install TypeScript and ts-node globally (if not already installed):**
   ```bash
   npm install -g typescript ts-node
   ```

## Configuration

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` with your database credentials:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=assessment_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

## Usage

### Basic Usage

```bash
# Generate report for a specific test
ts-node test-report-generator.ts <test-id>

# Example with your test ID
ts-node test-report-generator.ts 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd
```

### Alternative Commands

```bash
# Using npm script
npm run generate -- 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd

# Build and run JavaScript
npm run build
node dist/test-report-generator.js 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd
```

### How to Pass Test ID

#### Option 1: Command Line Argument (Recommended)
```bash
ts-node test-report-generator.ts 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd
```

#### Option 2: Environment Variable
```bash
# Set environment variable
export TEST_ID=1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd

# Run script
ts-node test-report-generator.ts
```

#### Option 3: Hardcode in Script
Edit the `main()` function in `test-report-generator.ts`:
```typescript
async function main() {
  // Hardcode your test ID here
  const testId = '1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd';
  
  // ... rest of the function
}
```

## Output

The script generates a CSV file (`test-report.csv`) with:

- **Column Headers**: User Id, Name, Email, Test Name, Question 1, Question 2, ..., Total Score
- **Question Headers**: Actual question text (truncated to 50 characters if too long)
- **User Rows**: Each user who took the test with their answers
- **Sorted by**: Score (highest first)

### Example CSV Output
```csv
User Id,Name,Email,Test Name,"Which of the following are 'facilitators' of resilience?","Methods and instruments that promote...",Total Score
376,User-376,No email,Quiz 3 4 and 5,C. Indigenous knowledge,A. Disaster Scenario,85
377,User-377,No email,Quiz 3 4 and 5,B. Community support,B. Risk assessment,92
```

## Project Structure

```
test-qna/
├── test-report-generator.ts    # Main TypeScript script
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── env.example                # Environment variables template
├── README.md                  # This file
└── node_modules/              # Installed dependencies
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `.env` file and database credentials
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Permission Error**
   - Make sure you have write permissions in the directory
   - Check if the output file is not locked by another process

3. **TypeScript Error**
   - Ensure TypeScript and ts-node are installed globally
   - Run `npm install` to install dependencies

4. **Module Error**
   - Run `npm install` to install dependencies
   - Check if `node_modules` folder exists

### Debug Mode

To see more detailed information, you can modify the script to add more logging:

```typescript
// Add this to see the generated SQL queries
console.log('Generated SQL:', query);
```

## Development

### Building the Project

```bash
# Compile TypeScript to JavaScript
npm run build

# The compiled files will be in the `dist/` folder
```

### Running Tests

```bash
# If you add tests later
npm test
```

## License

MIT License - feel free to modify and use as needed.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your database connection
3. Ensure all dependencies are installed
4. Check the console output for error messages

## Example Run

```bash
$ ts-node test-report-generator.ts 1bad6b2c-2dfe-4bf8-ad33-3f11ab751dbd

Connected to database successfully
Fetching questions...
Found 5 questions
Fetching user answers...
Found 25 answers from 5 users
Generating report...
Generated report for 5 users
Generating CSV...
Saving CSV file...
Report saved to: /path/to/test-qna/test-report.csv
✅ Report generation completed successfully!
📊 Generated report for 5 users with 5 questions
Disconnected from database
```

The script is now ready to use! Just run it with your test ID and it will generate the CSV report automatically. 
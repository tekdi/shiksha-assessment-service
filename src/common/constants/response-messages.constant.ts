export const RESPONSE_MESSAGES = {
    // Test Structure Management
    TEST_STRUCTURE_UPDATED: 'Test structure updated successfully',
    MISSING_SECTIONS_IN_STRUCTURE: (missingSections: string[]) => 
      `Missing sections in structure update: ${missingSections.join(', ')}`,
    MISSING_QUESTIONS_IN_STRUCTURE: (missingQuestions: string[]) => 
      `Missing questions in structure update: ${missingQuestions.join(', ')}`,
    SOME_SECTIONS_NOT_FOUND: 'Some sections not found or do not belong to the specified test',
    QUESTIONS_NOT_FOUND_IN_STRUCTURE: 'Some questions not found or do not belong to the specified sections',
  
    // Error messages
    ERROR: {
      CONFIG_NOT_FOUND: 'Configuration not found',
      CONFIG_FAILED: 'Failed to retrieve configuration',
      CONFIG_URL_MISSING: 'External configuration URL is missing',
      LMS_CONFIG_LOAD_FAILED: 'Failed to load LMS configuration',
      INVALID_UPLOAD_TYPE: 'Invalid upload type specified',
      ASSESSMENT_CONFIG_LOAD_FAILED: 'Failed to load Assessment configuration'
    }
  } as const; 
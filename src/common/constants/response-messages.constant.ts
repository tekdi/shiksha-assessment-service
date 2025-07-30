export const RESPONSE_MESSAGES = {
    // Test Structure Management
    TEST_STRUCTURE_UPDATED: 'Test structure updated successfully',
    MISSING_SECTIONS_IN_STRUCTURE: (missingSections: string[]) => 
      `Missing sections in structure update: ${missingSections.join(', ')}`,
    MISSING_QUESTIONS_IN_STRUCTURE: (missingQuestions: string[]) => 
      `Missing questions in structure update: ${missingQuestions.join(', ')}`,
    SOME_SECTIONS_NOT_FOUND: 'Some sections not found or do not belong to the specified test',
    QUESTIONS_NOT_FOUND_IN_STRUCTURE: 'Some questions not found or do not belong to the specified sections',
  
  } as const; 
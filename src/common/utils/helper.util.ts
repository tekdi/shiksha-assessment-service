import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { randomInt } from 'crypto';

@ValidatorConstraint({ name: 'validateDatetimeConstraints', async: false })
export class ValidateDatetimeConstraints implements ValidatorConstraintInterface {
  validate(endDateValue: string, args: ValidationArguments): boolean {
    const startDateStr = (args.object as any).startDate;
    if (!startDateStr) return true; // let other validators handle required

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateValue);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    if (startDate <= now) {
      return false;
    }

    if (endDate <= startDate) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid datetime constraints: Start date must be in the future, and end date must follow start date.';
  }
}

export class HelperUtil {
 
  /**
   * Generate a URL-friendly alias from a title
   * @param title The title to convert to an alias
   * @returns A URL-friendly alias string
   */
  static generateAlias(title: string): string {
    if (!title) return '';
    
    // Prevent DoS attacks by limiting input length
    const maxLength = 1000;
    if (title.length > maxLength) {
      title = title.substring(0, maxLength);
    }
    
    // Use more efficient regex patterns to prevent backtracking issues
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters (safe: character class)
      .replace(/\s+/g, '-')     // Replace spaces with hyphens (safe: \s+ is atomic)
      .replace(/-+/g, '-')      // Replace multiple hyphens with a single one (safe: -+ is atomic)
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens (safe: bounded patterns)
  }

  /**
   * Generate a unique alias using repository pattern
   * @param title The title to convert to an alias
   * @param repository The repository to check for existing aliases
   * @param tenantId The tenant ID for data isolation
   * @param organisationId Optional organization ID for data isolation
   * @returns A unique alias
   */
  static async generateUniqueAliasWithRepo(
    title: string,
    repository: any,
    tenantId: string,
    organisationId?: string
  ): Promise<string> {
    const baseAlias = this.generateAlias(title);
    
    // First try with the original alias
    const existingWithBase = await repository.findOne({
      where: { 
        alias: baseAlias,
        tenantId,
        ...(organisationId && { organisationId })
      }
    });

    if (!existingWithBase) {
      return baseAlias;
    }

    // Try with cryptographically secure random number
    let randomNum = randomInt(1000); // Generate random number between 0-999
    let finalAlias = `${baseAlias}-${randomNum}`;
    let attempts = 0;
    const maxAttempts = 100;
    while (true) {
      if (attempts++ > maxAttempts) {
        // Fallback to timestamp-based suffix
        return `${baseAlias}-${Date.now()}`;
      }
      
      const existing = await repository.findOne({
        where: { 
          alias: finalAlias,
          tenantId,
          ...(organisationId && { organisationId })
        }
      });

      if (!existing) {
        return finalAlias;
      }

      randomNum = randomInt(1000); // Generate new cryptographically secure random number
      finalAlias = `${baseAlias}-${randomNum}`;
    }
  }

}

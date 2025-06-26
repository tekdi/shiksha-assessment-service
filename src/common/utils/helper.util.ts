import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

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

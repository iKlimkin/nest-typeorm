import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsValidAnswers', async: true })
export class IsValidAnswersConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value || !Array.isArray(value)) {
      return false;
    }
    
    for (const item of value) {
      if (item.constructor !== String) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Each element of ${args.property} must be a string`;
  }
}

export function IsValidAnswers(
  property?: string,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsValidAnswersConstraint,
    });
  };
}

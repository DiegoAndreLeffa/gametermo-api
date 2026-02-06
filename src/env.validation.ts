import 'reflect-metadata';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @Transform(({ value }) => (typeof value === 'string' ? value : 'development').toLowerCase())
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsString()
  MONGO_URI: string;
}

export function validate(config: Record<string, unknown>) {
  const configWithDefaults = {
    NODE_ENV: config.NODE_ENV || 'development',
    PORT: config.PORT || 3000,
    MONGO_URI: config.MONGO_URI,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, configWithDefaults, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

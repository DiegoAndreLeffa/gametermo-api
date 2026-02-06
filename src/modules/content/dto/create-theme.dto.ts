// src/modules/content/dto/create-theme.dto.ts
import { IsArray, IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['CLASSIC', 'ATTRIBUTES'])
  type: 'CLASSIC' | 'ATTRIBUTES';

  @IsArray()
  @IsString({ each: true })
  attributeKeys: string[];
}

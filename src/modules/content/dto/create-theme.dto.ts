import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['CLASSIC', 'ATTRIBUTES'], description: 'Tipo de mecânica do jogo' })
  @IsEnum(['CLASSIC', 'ATTRIBUTES'])
  type: 'CLASSIC' | 'ATTRIBUTES';

  @IsArray()
  @IsString({ each: true })
  attributeKeys: string[];
}

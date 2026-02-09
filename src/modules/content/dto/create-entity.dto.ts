import { IsString, IsNotEmpty, IsObject, IsMongoId, IsUrl, IsOptional } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsMongoId()
  themeId: string;

  @IsObject()
  attributes: Record<string, any>;
}

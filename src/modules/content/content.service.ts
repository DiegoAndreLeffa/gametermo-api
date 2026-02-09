import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Theme, ThemeDocument } from './schemas/theme.schema';
import { Entity, EntityDocument } from './schemas/entity.schema';
import { CreateThemeDto } from './dto/create-theme.dto';
import { CreateEntityDto } from './dto/create-entity.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    @InjectModel(Entity.name) private entityModel: Model<EntityDocument>,
  ) {}

  async createTheme(dto: CreateThemeDto): Promise<Theme> {
    const existing = await this.themeModel.findOne({ slug: dto.slug });
    if (existing) throw new BadRequestException('Theme slug already exists');

    return this.themeModel.create(dto);
  }

  async createEntity(dto: CreateEntityDto): Promise<Entity> {
    const theme = await this.themeModel.findById(dto.themeId);
    if (!theme) throw new NotFoundException('Theme not found');

    if (theme.type === 'ATTRIBUTES') {
      if (!dto.attributes) {
        throw new BadRequestException('Attributes are required for this theme type');
      }
      const providedKeys = Object.keys(dto.attributes);
      const missingKeys = theme.attributeKeys.filter((key) => !providedKeys.includes(key));
      if (missingKeys.length > 0) {
        throw new BadRequestException(`Missing required attributes: ${missingKeys.join(', ')}`);
      }
    }

    try {
      return await this.entityModel.create({
        ...dto,
        theme: theme._id,
      });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === 11000)
        throw new BadRequestException('Entity name already exists in this theme');
      throw error;
    }
  }

  async getThemes() {
    return this.themeModel.find();
  }

  async getEntitiesByTheme(slug: string) {
    const theme = await this.themeModel.findOne({ slug });
    if (!theme) throw new NotFoundException('Theme not found');

    return this.entityModel.find({ theme: theme._id });
  }
}

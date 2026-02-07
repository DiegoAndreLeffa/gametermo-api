import { Body, Controller, Post, NotFoundException } from '@nestjs/common';
import { GameCoreService } from './game-core.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Theme } from '../content/schemas/theme.schema';
import { Entity } from '../content/schemas/entity.schema';

class SimulateDto {
  targetName: string;
  guessName: string;
  themeSlug: string;
}

@Controller('game-core')
export class GameCoreController {
  constructor(
    private readonly gameCoreService: GameCoreService,
    @InjectModel(Theme.name) private themeModel: Model<Theme>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
  ) {}

  @Post('simulate')
  async simulate(@Body() dto: SimulateDto) {
    const theme = await this.themeModel.findOne({ slug: dto.themeSlug });
    if (!theme) throw new NotFoundException('Theme not found');

    const target = await this.entityModel.findOne({ name: dto.targetName, theme: theme._id });
    const guess = await this.entityModel.findOne({ name: dto.guessName, theme: theme._id });

    if (!target || !guess) throw new NotFoundException('Target or Guess entity not found');

    return this.gameCoreService.compareEntities(guess, target, theme);
  }
}

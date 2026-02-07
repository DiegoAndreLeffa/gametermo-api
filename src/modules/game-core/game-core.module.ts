import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameCoreService } from './game-core.service';
import { GameCoreController } from './game-core.controller';
import { Theme, ThemeSchema } from '../content/schemas/theme.schema';
import { Entity, EntitySchema } from '../content/schemas/entity.schema';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    ContentModule,
    MongooseModule.forFeature([
      { name: Theme.name, schema: ThemeSchema },
      { name: Entity.name, schema: EntitySchema },
    ]),
  ],
  controllers: [GameCoreController],
  providers: [GameCoreService],
  exports: [GameCoreService],
})
export class GameCoreModule {}

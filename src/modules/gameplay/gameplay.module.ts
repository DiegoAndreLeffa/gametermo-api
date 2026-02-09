import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GameplayService } from './gameplay.service';
import { GameplayController } from './gameplay.controller';
import { GameSession, GameSessionSchema } from './schemas/game-session.schema';
import { DailyChallenge, DailyChallengeSchema } from './schemas/daily-challenge.schema';
import { ContentModule } from '../content/content.module';
import { GameCoreModule } from '../game-core/game-core.module';
import { Theme, ThemeSchema } from '../content/schemas/theme.schema';
import { Entity, EntitySchema } from '../content/schemas/entity.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSession.name, schema: GameSessionSchema },
      { name: DailyChallenge.name, schema: DailyChallengeSchema },
      { name: Theme.name, schema: ThemeSchema },
      { name: Entity.name, schema: EntitySchema },

      { name: Room.name, schema: RoomSchema },
    ]),
    ContentModule,
    GameCoreModule,
    UsersModule,
  ],
  controllers: [GameplayController],
  providers: [GameplayService],
})
export class GameplayModule {}

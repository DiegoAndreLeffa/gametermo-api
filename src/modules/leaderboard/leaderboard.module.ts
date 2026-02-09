import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSession, GameSessionSchema } from '../gameplay/schemas/game-session.schema';

@Module({
  imports: [
    UsersModule,
    RoomsModule,
    MongooseModule.forFeature([{ name: GameSession.name, schema: GameSessionSchema }]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}

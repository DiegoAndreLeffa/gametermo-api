import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  getGlobal() {
    return this.leaderboardService.getGlobalRanking();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('room/:roomId')
  getRoom(@Param('roomId') roomId: string) {
    return this.leaderboardService.getRoomRanking(roomId);
  }
}

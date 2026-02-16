import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Retorna o Top 100 do ranking global' })
  getGlobal() {
    return this.leaderboardService.getGlobalRanking();
  }

  @Get('time-attack')
  getTimeAttackRanking() {
    return this.leaderboardService.getTimeAttackRanking();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('room/:roomId')
  @ApiOperation({ summary: 'Retorna o ranking de vitórias de uma sala específica' })
  getRoom(@Param('roomId') roomId: string) {
    return this.leaderboardService.getRoomRanking(roomId);
  }
}

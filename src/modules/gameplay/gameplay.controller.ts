/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameplayService } from './gameplay.service';

@Controller('gameplay')
@UseGuards(AuthGuard('jwt'))
export class GameplayController {
  constructor(private readonly gameplayService: GameplayService) {}

  @Post('daily/:themeSlug/start')
  startDaily(@Request() req, @Param('themeSlug') themeSlug: string) {
    return this.gameplayService.startDailySession(req.user.userId, themeSlug);
  }

  @Post(':sessionId/guess')
  guess(@Request() req, @Param('sessionId') sessionId: string, @Body('guess') guessName: string) {
    return this.gameplayService.makeGuess(req.user.userId, sessionId, guessName);
  }

  @Post('room/:code/start')
  startRoom(@Request() req, @Param('code') code: string) {
    return this.gameplayService.startRoomSession(req.user.userId, code);
  }
}

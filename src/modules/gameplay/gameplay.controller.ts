/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameplayService } from './gameplay.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Gameplay')
@ApiBearerAuth()
@Controller('gameplay')
@UseGuards(AuthGuard('jwt'))
export class GameplayController {
  constructor(private readonly gameplayService: GameplayService) {}

  @Post('daily/:themeSlug/start')
  @ApiOperation({ summary: 'Inicia (ou continua) o desafio diário global' })
  startDaily(@Request() req, @Param('themeSlug') themeSlug: string) {
    return this.gameplayService.startDailySession(req.user.userId, themeSlug);
  }

  @Post(':sessionId/guess')
  @ApiOperation({ summary: 'Inicia desafio sincronizado da sala' })
  guess(@Request() req, @Param('sessionId') sessionId: string, @Body('guess') guessName: string) {
    return this.gameplayService.makeGuess(req.user.userId, sessionId, guessName);
  }

  @Post('room/:code/start')
  @ApiOperation({ summary: 'Envia um palpite (Nome do Campeão)' })
  startRoom(@Request() req, @Param('code') code: string) {
    return this.gameplayService.startRoomSession(req.user.userId, code);
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RoomsService } from './rooms.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova sala para amigos' })
  create(@Request() req, @Body() body: { name: string; themeSlug: string }) {
    return this.roomsService.createRoom(req.user.userId, body.themeSlug, body.name);
  }

  @Post('join')
  @ApiOperation({ summary: 'Entra em uma sala existente com um código' })
  join(@Request() req, @Body() body: { code: string }) {
    return this.roomsService.joinRoom(req.user.userId, body.code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma sala (membros, dono, etc)' })
  getDetails(@Param('id') id: string) {
    return this.roomsService.getRoomDetails(id);
  }
}

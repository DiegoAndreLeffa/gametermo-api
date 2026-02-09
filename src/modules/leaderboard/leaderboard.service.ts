import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { GameSession } from '../gameplay/schemas/game-session.schema';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private usersService: UsersService,
    private roomsService: RoomsService,
    @InjectModel(GameSession.name) private sessionModel: Model<GameSession>,
  ) {}

  async getGlobalRanking() {
    return this.usersService.getTopPlayers(100);
  }

  async getRoomRanking(roomId: string) {
    await this.roomsService.getRoomById(roomId);

    return this.sessionModel.aggregate([
      {
        $match: {
          roomId: new Object(roomId),
          status: 'WON',
        },
      },
      {
        $group: {
          _id: '$user',
          wins: { $sum: 1 },
          lastWin: { $max: '$createdAt' },
        },
      },
      {
        $sort: { wins: -1, lastWin: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          nickname: '$userInfo.nickname',
          avatar: '$userInfo.avatar',
          wins: 1,
        },
      },
    ]);
  }
}

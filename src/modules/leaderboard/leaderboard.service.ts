import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
          roomId: new Types.ObjectId(roomId),
          status: 'WON',
        },
      },
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          wins: { $sum: 1 },
          lastWin: { $max: '$createdAt' },
        },
      },
      {
        $sort: { totalScore: -1, wins: -1 },
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
          totalScore: 1,
          wins: 1,
        },
      },
    ]);
  }

  async getTimeAttackRanking(limit: number = 100) {
    return this.sessionModel.aggregate([
      {
        $match: {
          mode: 'TIME_ATTACK',
          status: 'WON',
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $group: {
          _id: '$user',
          bestScore: { $first: '$score' },
          bestTime: { $first: '$timeRemaining' },
          playedAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: { bestScore: -1 },
      },
      {
        $limit: limit,
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
          score: '$bestScore',
          timeRemaining: '$bestTime',
          date: '$playedAt',
        },
      },
    ]);
  }
}

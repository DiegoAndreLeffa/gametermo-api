/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GameSession, GameSessionDocument } from './schemas/game-session.schema';
import { DailyChallenge, DailyChallengeDocument } from './schemas/daily-challenge.schema';
import { Theme, ThemeDocument } from '../content/schemas/theme.schema';
import { Entity, EntityDocument } from '../content/schemas/entity.schema';
import { GameCoreService } from '../game-core/game-core.service';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class GameplayService {
  constructor(
    @InjectModel(GameSession.name)
    private sessionModel: Model<GameSessionDocument>,
    @InjectModel(DailyChallenge.name)
    private dailyModel: Model<DailyChallengeDocument>,
    @InjectModel(Theme.name)
    private themeModel: Model<ThemeDocument>,
    @InjectModel(Entity.name)
    private entityModel: Model<EntityDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private gameCoreService: GameCoreService,
    private usersService: UsersService,
  ) {}

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async startDailySession(userId: string, themeSlug: string) {
    const theme: ThemeDocument | null = await this.themeModel.findOne({ slug: themeSlug }).exec();

    if (!theme) throw new NotFoundException('Theme not found');

    const today = this.getTodayDate();

    let session = await this.sessionModel
      .findOne({
        user: userId,
        theme: theme._id,
        mode: 'DAILY',
        dailyDate: today,
      } as Record<string, any>)
      .populate('guesses')
      .exec();

    if (session) {
      const targetEntity = await this.entityModel.findById(session.targetEntity).exec();

      if (!targetEntity) throw new NotFoundException('Target entity data missing');

      return this.mapSessionResponse(session, theme, targetEntity);
    }

    let dailyChallenge = await this.dailyModel
      .findOne({
        theme: theme._id,
        date: today,
      } as Record<string, any>)
      .exec();

    if (!dailyChallenge) {
      const count = await this.entityModel
        .countDocuments({ theme: theme._id } as Record<string, any>)
        .exec();

      const random = Math.floor(Math.random() * count);

      const randomEntity = await this.entityModel
        .findOne({ theme: theme._id } as Record<string, any>)
        .skip(random)
        .exec();

      if (!randomEntity) throw new BadRequestException('No entities in theme');

      dailyChallenge = await this.dailyModel.create({
        theme: theme._id as any,
        entity: randomEntity._id as any,
        date: today,
      });
    }

    const targetEntityForSession = await this.entityModel.findById(dailyChallenge.entity).exec();

    if (!targetEntityForSession) throw new NotFoundException('Daily entity not found');

    session = await this.sessionModel.create({
      user: userId as any,
      theme: theme._id as any,
      mode: 'DAILY',
      dailyDate: today,
      targetEntity: dailyChallenge.entity,
      guesses: [],
      status: 'PLAYING',
    });

    return this.mapSessionResponse(session, theme, targetEntityForSession);
  }

  async makeGuess(userId: string, sessionId: string, guessName: string) {
    const session = await this.sessionModel
      .findOne({ _id: sessionId, user: userId } as Record<string, any>)
      .populate('targetEntity')
      .populate('guesses')
      .exec();

    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'PLAYING') throw new BadRequestException('Game already finished');

    const theme: ThemeDocument | null = await this.themeModel.findById(session.theme).exec();

    if (!theme) throw new NotFoundException('Theme not found');

    const guessEntity = await this.entityModel
      .findOne({
        name: guessName,
        theme: session.theme,
      } as Record<string, any>)
      .exec();

    if (!guessEntity) throw new NotFoundException('Champion not found in this theme');

    const alreadyGuessed = session.guesses.some((g: any) => g.name === guessEntity.name);

    if (alreadyGuessed) throw new BadRequestException('Already guessed this champion');

    const targetEntity = session.targetEntity as unknown as EntityDocument;

    const result = this.gameCoreService.compareEntities(guessEntity, targetEntity, theme);

    session.guesses.push(guessEntity as any);
    session.attempts += 1;

    if (result.correct) {
      session.status = 'WON';

      const pointsEarned = this.calculatePoints(session.attempts);

      if (session.mode !== 'INFINITE') {
        await this.usersService.addPoints(userId, pointsEarned);
      }
    }

    await session.save();

    return {
      gameStatus: session.status,
      turnResult: result,
    };
  }

  private mapSessionResponse(
    session: GameSessionDocument,
    theme: ThemeDocument,
    targetEntity: EntityDocument,
  ) {
    const history = (session.guesses as unknown as EntityDocument[]).map((guess) => {
      return this.gameCoreService.compareEntities(guess, targetEntity, theme);
    });

    return {
      sessionId: session._id,
      mode: session.mode,
      status: session.status,
      attempts: session.attempts,
      history: history.reverse(),
    };
  }

  async startRoomSession(userId: string, roomCode: string) {
    const today = this.getTodayDate();

    const room = await this.roomModel.findOne({ code: roomCode }).exec();
    if (!room) throw new NotFoundException('Room not found');

    const isMember = room.members.some((m: any) => m.toString() === userId);
    if (!isMember) throw new UnauthorizedException('User is not a member of this room');

    const theme = await this.themeModel.findById(room.theme).exec();
    if (!theme) throw new NotFoundException('Theme not found for this room');

    if (room.currentDailyDate !== today || !room.currentDailyEntity) {
      const count = await this.entityModel
        .countDocuments({ theme: room.theme } as Record<string, any>)
        .exec();

      if (count === 0) throw new BadRequestException('Theme has no entities');

      const random = Math.floor(Math.random() * count);
      const randomEntity = await this.entityModel
        .findOne({ theme: room.theme } as Record<string, any>)
        .skip(random)
        .exec();

      if (!randomEntity) throw new BadRequestException('Error picking entity');

      room.currentDailyEntity = randomEntity._id;
      room.currentDailyDate = today;
      await room.save();
    }

    const targetEntity = await this.entityModel.findById(room.currentDailyEntity).exec();

    if (!targetEntity) throw new NotFoundException('Room entity not found');

    const existingSession = await this.sessionModel
      .findOne({
        user: userId,
        mode: 'ROOM_DAILY',
        dailyDate: today,
        roomId: room._id,
      } as Record<string, any>)
      .populate('guesses')
      .exec();

    if (existingSession) {
      return this.mapSessionResponse(existingSession, theme, targetEntity);
    }

    const session = await this.sessionModel.create({
      user: userId as any,
      theme: room.theme as any,
      mode: 'ROOM_DAILY',
      dailyDate: today,
      targetEntity: targetEntity._id as any,
      roomId: room._id as any,
      guesses: [],
      status: 'PLAYING',
    });

    return this.mapSessionResponse(session, theme, targetEntity);
  }

  private calculatePoints(attempts: number): number {
    const maxPoints = 1000;
    const penaltyPerGuess = 100;
    const penalty = (attempts - 1) * penaltyPerGuess;
    return Math.max(100, maxPoints - penalty);
  }
}

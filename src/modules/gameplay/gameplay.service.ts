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
import { Model, Types } from 'mongoose';

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

  MAX_ATTEMPTS = 15;
  TIME_LIMIT_SECONDS = 120; // 2 Minutos
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
      .findOne({
        _id: sessionId,
        user: userId,
      } as any)
      .populate('targetEntity')
      .populate('guesses');

    if (!session) throw new NotFoundException('Session not found');

    const theme = await this.themeModel.findById(session.theme);
    if (!theme) throw new NotFoundException('Theme not found');

    if (session.status !== 'PLAYING') {
      return this.mapSessionResponse(session, theme);
    }

    if (session.guesses.length >= this.MAX_ATTEMPTS) {
      session.status = 'LOST';
      await session.save();
      throw new BadRequestException('Você excedeu o número máximo de tentativas!');
    }

    if (session.mode === 'TIME_ATTACK' && session.expiresAt) {
      const now = new Date();
      if (now > session.expiresAt) {
        session.status = 'LOST';
        await session.save();
        throw new BadRequestException('Tempo esgotado! Game Over.');
      }
    }

    const guessEntity = await this.entityModel.findOne({ name: guessName, theme: session.theme });
    if (!guessEntity) throw new NotFoundException('Champion not found');

    const alreadyGuessed = session.guesses.some((g: any) => g.name === guessEntity.name);
    if (alreadyGuessed) throw new BadRequestException('Already guessed');

    const result = this.gameCoreService.compareEntities(
      guessEntity,
      session.targetEntity as any,
      theme,
    );

    session.guesses.push(guessEntity);
    session.attempts += 1;

    if (result.correct) {
      session.status = 'WON';

      let points = 0;
      if (session.mode === 'TIME_ATTACK' && session.expiresAt) {
        const timeLeftMs = session.expiresAt.getTime() - new Date().getTime();
        const secondsLeft = Math.max(0, Math.floor(timeLeftMs / 1000));

        session.timeRemaining = secondsLeft;

        points = 500 + secondsLeft * 10 - (session.attempts - 1) * 10;
      } else {
        points = this.calculatePoints(session.attempts, session.usedHint);
      }
      points = Math.max(0, points);
      session.score = points;
      if (session.mode === 'DAILY') {
        await this.usersService.addPoints(userId, points);
      }
    } else {
      if (session.attempts >= this.MAX_ATTEMPTS) {
        session.status = 'LOST';
      }
    }

    await session.save();

    return {
      gameStatus: session.status,
      turnResult: result,
      correctEntity: session.status === 'LOST' ? session.targetEntity : null,
    };
  }

  private mapSessionResponse(session: any, theme: Theme, targetEntityOverride?: any) {
    const target = targetEntityOverride || session.targetEntity;

    const history = session.guesses.map((guess: any) =>
      this.gameCoreService.compareEntities(guess, target, theme),
    );

    return {
      sessionId: session._id,
      mode: session.mode,
      status: session.status,
      attempts: session.attempts,
      usedHint: session.usedHint,
      expiresAt: session.expiresAt,
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

  private calculatePoints(attempts: number, usedHint: boolean): number {
    const maxPoints = 100;
    const penaltyPerGuess = 5;
    const hintPenalty = 25; // Custa 25 pontos usar a dica

    const guessPenalty = (attempts - 1) * penaltyPerGuess;
    const totalPenalty = guessPenalty + (usedHint ? hintPenalty : 0);

    return Math.max(10, maxPoints - totalPenalty);
  }

  async useHint(userId: string, sessionId: string) {
    const session = await this.sessionModel
      .findOne({
        _id: sessionId,
        user: new Types.ObjectId(userId) as any,
      })
      .populate('targetEntity'); // Precisamos do alvo para pegar o título

    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'PLAYING') throw new BadRequestException('Game finished');

    if (session.usedHint) {
      // Se já usou, só retorna o título de novo sem erro (idempotente)
      return { hint: session.targetEntity.attributes.get('Title') };
    }

    // Marca como usada e salva
    session.usedHint = true;
    await session.save();

    // Retorna o Título (Title) que salvamos no Seed
    // O Seed salvou como attributes: { 'Title': '...' }
    const title = session.targetEntity.attributes.get('Title');

    return { hint: title };
  }

  async startInfiniteSession(userId: string, themeSlug: string) {
    const theme = await this.themeModel.findOne({ slug: themeSlug });
    if (!theme) throw new NotFoundException('Theme not found');

    const activeSession = await this.sessionModel
      .findOne({
        user: userId,
        theme: theme._id,
        mode: 'INFINITE',
        status: 'PLAYING',
      } as any)
      .populate('guesses')
      .populate('targetEntity');

    if (activeSession) {
      return this.mapSessionResponse(activeSession, theme);
    }

    const count = await this.entityModel.countDocuments({ theme: theme._id });
    const random = Math.floor(Math.random() * count);
    const randomEntity = await this.entityModel.findOne({ theme: theme._id }).skip(random);

    if (!randomEntity) throw new BadRequestException('No champions found');

    const session = await this.sessionModel.create({
      user: userId as any,
      theme: theme._id as any,
      mode: 'INFINITE',
      targetEntity: randomEntity._id as any,
      guesses: [],
      status: 'PLAYING',
      attempts: 0,
      score: 0,
    });

    return this.mapSessionResponse(session, theme, randomEntity);
  }

  async startTimeAttack(userId: string, themeSlug: string) {
    const theme = await this.themeModel.findOne({ slug: themeSlug });
    if (!theme) throw new NotFoundException('Theme not found');

    const count = await this.entityModel.countDocuments({ theme: theme._id });
    const random = Math.floor(Math.random() * count);
    const randomEntity = await this.entityModel.findOne({ theme: theme._id }).skip(random);

    if (!randomEntity) throw new BadRequestException('No champions found to play');

    const expiresAt = new Date();
    const TIME_LIMIT_SECONDS = 120;
    expiresAt.setSeconds(expiresAt.getSeconds() + TIME_LIMIT_SECONDS);

    const session = await this.sessionModel.create({
      user: new Types.ObjectId(userId) as any,
      theme: theme._id as any,
      mode: 'TIME_ATTACK',
      targetEntity: randomEntity._id as any,
      guesses: [],
      status: 'PLAYING',
      expiresAt: expiresAt,
    });

    return this.mapSessionResponse(session, theme);
  }
}

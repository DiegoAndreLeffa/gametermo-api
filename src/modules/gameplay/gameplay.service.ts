/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GameSession, GameSessionDocument } from './schemas/game-session.schema';
import { DailyChallenge, DailyChallengeDocument } from './schemas/daily-challenge.schema';
import { Theme, ThemeDocument } from '../content/schemas/theme.schema';
import { Entity, EntityDocument } from '../content/schemas/entity.schema';
import { GameCoreService } from '../game-core/game-core.service';

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
    private gameCoreService: GameCoreService,
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
}

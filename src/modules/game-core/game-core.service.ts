/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { Entity } from '../content/schemas/entity.schema';
import { Theme } from '../content/schemas/theme.schema';
import {
  AttributeResult,
  Direction,
  GameTurnResult,
  MatchStatus,
} from './interfaces/game-result.interface';

@Injectable()
export class GameCoreService {
  /**
   * Compara duas entidades baseadas nas regras do Tema
   */
  compareEntities(guess: Entity, target: Entity, theme: Theme): GameTurnResult {
    const isCorrect = guess.name === target.name;
    const results: AttributeResult[] = [];

    if (theme.type === 'ATTRIBUTES') {
      for (const key of theme.attributeKeys) {
        const guessVal = guess.attributes.get(key);
        const targetVal = target.attributes.get(key);

        results.push(this.compareAttribute(key, guessVal, targetVal));
      }
    }

    return {
      guessedEntity: {
        name: guess.name,
        imageUrl: guess.imageUrl,
      },
      correct: isCorrect,
      results,
    };
  }

  private compareAttribute(key: string, guessVal: any, targetVal: any): AttributeResult {
    let status = MatchStatus.INCORRECT;
    let direction = Direction.NONE;

    const normGuess = String(guessVal).toLowerCase().trim();
    const normTarget = String(targetVal).toLowerCase().trim();

    const isArrayComparison =
      Array.isArray(guessVal) || (typeof guessVal === 'string' && guessVal.includes(','));

    if (isArrayComparison) {
      status = this.compareArrays(guessVal, targetVal);
    } else if (!isNaN(Number(guessVal)) && !isNaN(Number(targetVal))) {
      const gNum = Number(guessVal);
      const tNum = Number(targetVal);

      if (gNum === tNum) {
        status = MatchStatus.CORRECT;
        direction = Direction.EQUAL;
      } else {
        status = MatchStatus.INCORRECT;
        direction = gNum < tNum ? Direction.UP : Direction.DOWN;
      }
    } else {
      if (normGuess === normTarget) {
        status = MatchStatus.CORRECT;
      }
    }

    return {
      attribute: key,
      value: guessVal,
      status,
      direction,
    };
  }

  private compareArrays(guessVal: any, targetVal: any): MatchStatus {
    const toArray = (val: any) =>
      Array.isArray(val)
        ? val
        : String(val)
            .split(',')
            .map((s) => s.trim());

    const guessArr = toArray(guessVal);
    const targetArr = toArray(targetVal);

    const intersection = guessArr.filter((x) => targetArr.includes(x));

    const exactMatch =
      guessArr.length === targetArr.length && intersection.length === guessArr.length;

    if (exactMatch) return MatchStatus.CORRECT;
    if (intersection.length > 0) return MatchStatus.PARTIAL;
    return MatchStatus.INCORRECT;
  }
}

export enum MatchStatus {
  CORRECT = 'CORRECT',
  PARTIAL = 'PARTIAL',
  INCORRECT = 'INCORRECT',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  EQUAL = 'EQUAL',
  NONE = 'NONE',
}

export interface AttributeResult {
  attribute: string;
  value: any;
  status: MatchStatus;
  direction: Direction;
}

export interface GameTurnResult {
  guessedEntity: {
    name: string;
    imageUrl: string;
  };
  correct: boolean;
  results: AttributeResult[];
}

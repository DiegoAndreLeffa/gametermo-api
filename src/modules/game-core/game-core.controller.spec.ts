import { Test, TestingModule } from '@nestjs/testing';
import { GameCoreController } from './game-core.controller';

describe('GameCoreController', () => {
  let controller: GameCoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameCoreController],
    }).compile();

    controller = module.get<GameCoreController>(GameCoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

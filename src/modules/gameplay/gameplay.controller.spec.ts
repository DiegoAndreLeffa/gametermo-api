import { Test, TestingModule } from '@nestjs/testing';
import { GameplayController } from './gameplay.controller';

describe('GameplayController', () => {
  let controller: GameplayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameplayController],
    }).compile();

    controller = module.get<GameplayController>(GameplayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

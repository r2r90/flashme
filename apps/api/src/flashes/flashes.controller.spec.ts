import { Test, TestingModule } from '@nestjs/testing';
import { FlashesController } from './flashes.controller';

describe('FlashesController', () => {
  let controller: FlashesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashesController],
    }).compile();

    controller = module.get<FlashesController>(FlashesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

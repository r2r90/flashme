import { Test, TestingModule } from '@nestjs/testing';
import { FlashesController } from './flashes.controller';
import { FlashesService } from './flashes.service';

const mockFlashesService = {
  create: jest.fn(),
  findAllByTenant: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};

describe('FlashesController', () => {
  let controller: FlashesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashesController],
      providers: [{ provide: FlashesService, useValue: mockFlashesService }],
    }).compile();

    controller = module.get<FlashesController>(FlashesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

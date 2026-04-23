import { Test, TestingModule } from '@nestjs/testing';
import { FlashesService } from './flashes.service';

describe('FlashesService', () => {
  let service: FlashesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlashesService],
    }).compile();

    service = module.get<FlashesService>(FlashesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

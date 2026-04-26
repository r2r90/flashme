import { Module } from '@nestjs/common';
import { FlashesService } from './flashes.service';
import { FlashesController } from './flashes.controller';

@Module({
  providers: [FlashesService],
  controllers: [FlashesController],
})
export class FlashesModule {}

import { Global, Module } from '@nestjs/common';
import { FxRateService } from './fx.service';

@Global()
@Module({
  providers: [FxRateService],
  exports: [FxRateService],
})
export class FxModule {}
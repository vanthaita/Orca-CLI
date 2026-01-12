import { Module } from '@nestjs/common';
import { SepayModule } from './sepay/sepay.module';

@Module({
  imports: [SepayModule],
  exports: [SepayModule],
})
export class SubscriptionModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PaymentsModule } from '../payments/payments.module'; // Import du module Payment existant

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PaymentsModule, // Permet d'injecter PaymentsService
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
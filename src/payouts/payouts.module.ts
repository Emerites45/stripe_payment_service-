import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [TransactionsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}

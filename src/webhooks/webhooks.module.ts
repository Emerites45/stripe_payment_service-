import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { StripeWebhookController} from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [TransactionsModule,StripeModule,PaymentsModule],
  controllers: [StripeWebhookController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}

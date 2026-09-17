import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { EurekaModule } from './eureka/eureka.module';
import { StripeModule } from './stripe/stripe.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('database.url');
        const isNeon = dbUrl?.includes('neon.tech');

        return {
          type: 'postgres',
          url: dbUrl,
          // SSL actif uniquement si on utilise Neon ou la prod
          ssl: isNeon ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production',
        };
      },
    }),
    EurekaModule,
    StripeModule,
    TransactionsModule,
    PaymentsModule,
    PayoutsModule,
    WebhooksModule,
    HealthModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}

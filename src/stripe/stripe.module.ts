import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT, StripeService } from './stripe.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secretKey = config.get<string>('stripe.secretKey');
        if (!secretKey) {
          throw new Error('STRIPE_SECRET_KEY manquant — vérifie ton fichier .env (utilise une clé sk_test_...)');
        }
        return new Stripe(secretKey);
      },
    },
    StripeService,
  ],
  exports: [StripeService, STRIPE_CLIENT],
})
export class StripeModule {}

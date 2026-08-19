import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

@Injectable()
export class StripeService {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  get client(): Stripe {
    return this.stripe;
  }
}

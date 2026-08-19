import { Controller, Post, Req, Res, Headers, HttpStatus, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';
import { PaymentsService } from 'src/payments/payments.service';

@Controller('payments/webhook')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Res() res: Response,
  @Headers('stripe-signature') signature: string,
) {
  if (!req.rawBody) {
    return res.status(HttpStatus.BAD_REQUEST).send('Missing raw body');
  }

  let event: Stripe.Event;
  try {
    event = this.stripeService.client.webhooks.constructEvent(
      req.rawBody, // maintenant TypeScript sait que c'est un Buffer, plus jamais undefined
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err}`);
  }

  await this.paymentsService.handleWebhookEvent(event);

  return res.status(HttpStatus.OK).json({ received: true });
}
}
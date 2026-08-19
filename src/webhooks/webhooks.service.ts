import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus, TransactionType } from '../transactions/entities/transaction.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly transactionsService: TransactionsService,
    private readonly config: ConfigService,
  ) {}

  async handleEvent(rawBody: Buffer | undefined, signature: string) {
    if (!rawBody) throw new BadRequestException('Corps de la requête manquant (rawBody)');
    if (!signature) throw new BadRequestException('En-tête stripe-signature manquant');

    const webhookSecret = this.config.getOrThrow<string>('stripe.webhookSecret');
    let event: Stripe.Event;

    try {
      event = this.stripeService.client.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Signature de webhook invalide: ${(err as Error).message}`);
      throw new BadRequestException('Signature invalide');
    }

    this.logger.log(`Événement Stripe reçu: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.upsertFromEvent(event, TransactionType.DEPOSIT, TransactionStatus.SUCCEEDED);
        break;
      case 'payment_intent.payment_failed':
        await this.upsertFromEvent(event, TransactionType.DEPOSIT, TransactionStatus.FAILED);
        break;
      case 'payment_intent.canceled':
        await this.upsertFromEvent(event, TransactionType.DEPOSIT, TransactionStatus.CANCELED);
        break;
      case 'transfer.created':
        await this.upsertFromEvent(event, TransactionType.TRANSFER, TransactionStatus.SUCCEEDED);
        break;
      case 'payout.paid':
        await this.upsertFromEvent(event, TransactionType.PAYOUT, TransactionStatus.SUCCEEDED);
        break;
      case 'payout.failed':
        await this.upsertFromEvent(event, TransactionType.PAYOUT, TransactionStatus.FAILED);
        break;
      case 'charge.refunded':
        await this.upsertFromEvent(event, TransactionType.REFUND, TransactionStatus.SUCCEEDED);
        break;
      default:
        this.logger.debug(`Événement non traité: ${event.type}`);
    }

    return { received: true };
  }

  private async upsertFromEvent(event: Stripe.Event, type: TransactionType, status: TransactionStatus) {
    const object = event.data.object as Stripe.PaymentIntent | Stripe.Transfer | Stripe.Payout | Stripe.Charge;
    const existing = await this.transactionsService.findByStripeObjectId(object.id);

    if (existing) {
      await this.transactionsService.updateStatus(object.id, status, event as unknown as Record<string, any>);
      return;
    }

    const amount = 'amount' in object ? object.amount : 0;
    const currency = 'currency' in object ? object.currency : 'eur';

    await this.transactionsService.create({
      type,
      stripeObjectId: object.id,
      stripeObjectType: event.data.object['object'],
      amount,
      currency,
      status,
      lastEvent: event as unknown as Record<string, any>,
    });
  }
}
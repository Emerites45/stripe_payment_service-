import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus, TransactionType } from '../transactions/entities/transaction.entity';
import { ConfirmDepositDto, CreateDepositDto } from './dto/payments.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async createDeposit(dto: CreateDepositDto) {
    try {
      const stripe = this.stripeService.client;

      let customerId: string | undefined;
      if (dto.customerEmail) {
        const customer = await stripe.customers.create({ email: dto.customerEmail });
        customerId = customer.id;
      }

      const paymentIntent = await stripe.paymentIntents.create({
  amount: dto.amount,
  currency: dto.currency.toLowerCase(),
  customer: customerId,
  description: dto.description,
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'never', // pas de méthodes à redirection, adapté à ta confirmation côté serveur
  },
});

      await this.transactionsService.create({
        type: TransactionType.DEPOSIT,
        stripeObjectId: paymentIntent.id,
        stripeObjectType: 'payment_intent',
        amount: dto.amount,
        currency: dto.currency.toLowerCase(),
        status: TransactionStatus.PENDING,
        customerId: customerId ?? null,
        description: dto.description ?? null,
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeConnectionError) {
        this.logger.error(
          `Stripe connection error: ${error.message}`,
          { code: (error as any).code, detail: (error as any).raw?.detail },
        );
        throw new ServiceUnavailableException(
          'Service de paiement temporairement indisponible, réessayez.',
        );
      }
      throw error;
    }
  }

  // Confirmation côté serveur avec un moyen de paiement de test — pratique pour tester
  // via curl/Postman sans construire de frontend. En production, la confirmation se fait
  // côté client avec Stripe.js/le SDK mobile, jamais côté serveur avec de vraies cartes.
  async confirmDeposit(dto: ConfirmDepositDto) {
    const stripe = this.stripeService.client;
    const paymentMethod = dto.paymentMethod ?? 'pm_card_visa';

    const paymentIntent = await stripe.paymentIntents.confirm(dto.paymentIntentId, {
      payment_method: paymentMethod,
    });

    await this.transactionsService.updateStatus(
      paymentIntent.id,
      this.mapStripeStatus(paymentIntent.status),
      paymentIntent as unknown as Record<string, any>,
    );

    return { paymentIntentId: paymentIntent.id, status: paymentIntent.status };
  }

  async getDeposit(paymentIntentId: string) {
    const tx = await this.transactionsService.findByStripeObjectId(paymentIntentId);
    if (!tx) throw new NotFoundException('Transaction introuvable');
    return tx;
  }

  /**
   * Point d'entrée unique appelé par le WebhookController.
   * Centralise le routing par type d'événement — le contrôleur reste "bête".
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Webhook reçu: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.processing':
      case 'payment_intent.requires_action':
      case 'payment_intent.canceled':
        await this.handleWebhookUpdate(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // Pas grave si on ne gère pas tous les types — on log juste pour visibilité
        this.logger.debug(`Événement non traité: ${event.type}`);
    }
  }

  /**
   * Met à jour le statut local d'une transaction à partir d'un PaymentIntent
   * reçu via webhook (source de vérité, contrairement à confirmDeposit qui
   * ne reflète que le résultat immédiat côté client).
   */
  private async handleWebhookUpdate(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const tx = await this.transactionsService.findByStripeObjectId(paymentIntent.id);

    if (!tx) {
      // Ne PAS throw ici : Stripe retentera indéfiniment le webhook si on renvoie une erreur.
      // On log juste — ça peut arriver si le PaymentIntent a été créé hors de ce service
      // (ex: test direct dans le dashboard Stripe).
      this.logger.warn(
        `Webhook reçu pour un PaymentIntent inconnu localement: ${paymentIntent.id}`,
      );
      return;
    }

    const newStatus = this.mapStripeStatus(paymentIntent.status);

    await this.transactionsService.updateStatus(
      paymentIntent.id,
      newStatus,
      paymentIntent as unknown as Record<string, any>,
    );

    this.logger.log(
      `Transaction ${paymentIntent.id} mise à jour → ${newStatus} (via webhook)`,
    );
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const tx = await this.transactionsService.findByStripeObjectId(paymentIntent.id);

    if (!tx) {
      this.logger.warn(
        `Webhook payment_failed pour un PaymentIntent inconnu: ${paymentIntent.id}`,
      );
      return;
    }

    const failureReason = paymentIntent.last_payment_error?.message ?? 'Raison inconnue';

    await this.transactionsService.updateStatus(
      paymentIntent.id,
      TransactionStatus.FAILED,
      paymentIntent as unknown as Record<string, any>,
    );

    this.logger.warn(`Paiement échoué pour ${paymentIntent.id}: ${failureReason}`);
  }

  private mapStripeStatus(stripeStatus: string): TransactionStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return TransactionStatus.SUCCEEDED;
      case 'requires_action':
      case 'requires_confirmation':
        return TransactionStatus.REQUIRES_ACTION;
      case 'canceled':
        return TransactionStatus.CANCELED;
      case 'processing':
        return TransactionStatus.PENDING;
      default:
        return TransactionStatus.PENDING;
    }
  }
}
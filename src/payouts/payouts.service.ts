import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus, TransactionType } from '../transactions/entities/transaction.entity';
import { CreatePayoutDto } from './dto/payouts.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // "Retrait" au sens plateforme -> compte connecté Stripe (objet Stripe: Transfer)
  async createTransfer(dto: CreatePayoutDto) {
    if (!dto.connectedAccountId) {
      throw new BadRequestException('connectedAccountId est requis pour un transfert');
    }

    const stripe = this.stripeService.client;

    const transfer = await stripe.transfers.create({
      amount: dto.amount,
      currency: dto.currency.toLowerCase(),
      destination: dto.connectedAccountId,
      description: dto.description,
    });

    await this.transactionsService.create({
      type: TransactionType.TRANSFER,
      stripeObjectId: transfer.id,
      stripeObjectType: 'transfer',
      amount: dto.amount,
      currency: dto.currency.toLowerCase(),
      status: TransactionStatus.SUCCEEDED, // un Transfer Stripe réussi est immédiat, y compris en sandbox
      connectedAccountId: dto.connectedAccountId,
      description: dto.description ?? null,
    });

    return { transferId: transfer.id, status: 'succeeded' };
  }

  // "Retrait" au sens compte connecté -> banque du bénéficiaire (objet Stripe: Payout)
  // Nécessite que le compte connecté ait terminé son onboarding Stripe Connect (informations bancaires renseignées).
  async createPayoutToBank(connectedAccountId: string, dto: CreatePayoutDto) {
    const stripe = this.stripeService.client;

    const payout = await stripe.payouts.create(
      {
        amount: dto.amount,
        currency: dto.currency.toLowerCase(),
        description: dto.description,
      },
      { stripeAccount: connectedAccountId },
    );

    await this.transactionsService.create({
      type: TransactionType.PAYOUT,
      stripeObjectId: payout.id,
      stripeObjectType: 'payout',
      amount: dto.amount,
      currency: dto.currency.toLowerCase(),
      status: TransactionStatus.PENDING,
      connectedAccountId,
      description: dto.description ?? null,
    });

    return { payoutId: payout.id, status: payout.status };
  }

  async getPayout(id: string) {
    const tx = await this.transactionsService.findByStripeObjectId(id);
    if (!tx) throw new NotFoundException('Transaction introuvable');
    return tx;
  }
}

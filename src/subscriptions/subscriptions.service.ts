import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlanId, SubscriptionStatus, TargetAudience } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createSubscription(user: any, dto: CreateSubscriptionDto) {
    const userId = user?.id || user?.userId || dto.userId || '62f10169-3557-4a7a-aa61-a17915b3b80a';
    const practicienId = user?.practicien?.id || dto.practicienId || null;

    const startDate = new Date();
    const endDate = new Date(startDate);
    // Valable 1 mois par défaut (ou à vie pour les plans gratuits / 100 ans)
    if (dto.amount === 0) {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Désactiver tout autre abonnement actif
    await this.subscriptionRepo.update(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    const subscription = this.subscriptionRepo.create({
      userId,
      practicienId,
      audience: dto.audience,
      planId: dto.planId,
      planTitle: dto.planTitle,
      amount: dto.amount,
      currency: 'eur',
      paymentMethod: dto.paymentMethod,
      status: dto.amount === 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      startDate,
      endDate,
    });

    const savedSubscription = await this.subscriptionRepo.save(subscription);

    // Si plan payant par carte
    if (dto.amount > 0 && dto.paymentMethod === 'card') {
      const amountInCents = Math.round(dto.amount * 100);

      const depositRes = await this.paymentsService.createDeposit({
        amount: amountInCents,
        currency: 'eur',
        customerEmail: dto.customerEmail || user?.email || 'cod2camp@gmail.com',
        description: `Souscription ${dto.planTitle} - User: ${userId}`,
      });

      savedSubscription.paymentIntentId = depositRes.paymentIntentId;
      await this.subscriptionRepo.save(savedSubscription);

      return {
        subscription: savedSubscription,
        paymentData: depositRes,
      };
    }

    return {
      subscription: savedSubscription,
      paymentData: null,
    };
  }

  async GetActiveUserSubscription(userId: string) {
    const now = new Date();

    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!activeSub) {
      return { hasActiveSubscription: false, subscription: null };
    }

    if (activeSub.endDate < now) {
      activeSub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepo.save(activeSub);
      return { hasActiveSubscription: false, subscription: activeSub };
    }

    return {
      hasActiveSubscription: true,
      subscription: activeSub,
    };
  }

  async confirmSubscriptionPayment(paymentIntentId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { paymentIntentId },
    });

    if (!subscription) {
      throw new NotFoundException('Souscription introuvable pour ce paiement.');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    return await this.subscriptionRepo.save(subscription);
  }
}
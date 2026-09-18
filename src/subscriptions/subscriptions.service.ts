import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlanId, SubscriptionStatus, TargetAudience } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createSubscription(user: any, dto: CreateSubscriptionDto) {
    this.logger.log(`[CREATE SUB] Nouvelle tentative de souscription reçue. DTO: ${JSON.stringify(dto)}`);

    const userId = user?.id || user?.userId || dto.userId || '62f10169-3557-4a7a-aa61-a17915b3b80a';
    const practicienId = user?.practicien?.id || dto.practicienId || null;

    this.logger.log(`[CREATE SUB] Utilisateur identifié -> userId: ${userId}, practicienId: ${practicienId}`);

    const startDate = new Date();
    const endDate = new Date(startDate);

    // Valable 1 mois par défaut (ou à vie pour les plans gratuits / 100 ans)
    if (dto.amount === 0) {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Désactiver tout autre abonnement actif
    this.logger.log(`[CREATE SUB] Annulation des anciens abonnements actifs pour l'utilisateur: ${userId}`);
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
    this.logger.log(`[CREATE SUB] Abonnement créé en BDD (ID: ${savedSubscription.id}) - Statut initial: ${savedSubscription.status}`);

    // Si plan payant par carte
    if (dto.amount > 0 && dto.paymentMethod === 'card') {
      const amountInCents = Math.round(dto.amount * 100);
      this.logger.log(`[CREATE SUB] Appel à PaymentsService.createDeposit pour ${amountInCents} cents...`);

      const depositRes = await this.paymentsService.createDeposit({
        amount: amountInCents,
        currency: 'eur',
        customerEmail: dto.customerEmail || user?.email || 'cod2camp@gmail.com',
        description: `Souscription ${dto.planTitle} - User: ${userId}`,
      });

      this.logger.log(`[CREATE SUB] Deposit Stripe généré -> PaymentIntentID: ${depositRes.paymentIntentId}`);

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
    this.logger.log(`[GET ACTIVE SUB] Recherche d'un abonnement actif pour userId: ${userId}`);
    const now = new Date();

    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!activeSub) {
      this.logger.warn(`[GET ACTIVE SUB] Aucun abonnement actif trouvé en BDD pour userId: ${userId}`);
      return { hasActiveSubscription: false, subscription: null };
    }

    if (activeSub.endDate < now) {
      this.logger.warn(`[GET ACTIVE SUB] Abonnement ID ${activeSub.id} expiré le ${activeSub.endDate}. Passage au statut EXPIRED.`);
      activeSub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepo.save(activeSub);
      return { hasActiveSubscription: false, subscription: activeSub };
    }

    this.logger.log(`[GET ACTIVE SUB] Abonnement actif valide trouvé (ID: ${activeSub.id}, Plan: ${activeSub.planTitle})`);
    return {
      hasActiveSubscription: true,
      subscription: activeSub,
    };
  }

  async confirmSubscriptionPayment(paymentIntentId: string) {
    this.logger.log(`[CONFIRM PAYMENT] Confirmation demandée pour PaymentIntentID: ${paymentIntentId}`);

    const subscription = await this.subscriptionRepo.findOne({
      where: { paymentIntentId },
    });

    if (!subscription) {
      this.logger.error(`[CONFIRM PAYMENT] ERREUR : Aucune souscription trouvée pour le PaymentIntentID: ${paymentIntentId}`);
      throw new NotFoundException('Souscription introuvable pour ce paiement.');
    }

    this.logger.log(`[CONFIRM PAYMENT] Souscription ID ${subscription.id} trouvée (Statut actuel: ${subscription.status}). Passée à ACTIVE.`);
    subscription.status = SubscriptionStatus.ACTIVE;
    const updatedSub = await this.subscriptionRepo.save(subscription);

    this.logger.log(`[CONFIRM PAYMENT] Souscription ID ${updatedSub.id} confirmée et activée avec succès.`);
    return updatedSub;
  }
}
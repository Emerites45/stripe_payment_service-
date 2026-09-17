import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
// Assurez-vous d'utiliser votre garde JWT personnalisé


@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * POST /subscriptions
   * Déclenché par le frontend lors du clic sur souscrire/payer
   */
  @Post()
  async createSubscription(@Req() req, @Body() dto: CreateSubscriptionDto) {
    // req.user contient le JSON retourné après login (User + Practicien)
    return await this.subscriptionsService.createSubscription(req.user, dto);
  }

  /**
   * GET /subscriptions/my-status
   * Utilisé au chargement du tableau de bord ou de la page de prix
   * pour savoir si le practicien a déjà souscrit à un plan.
   */
  @Get('my-status')
  async getMySubscriptionStatus(@Req() req) {
    return await this.subscriptionsService.GetActiveUserSubscription(req.user.id);
  }

  /**
   * POST /subscriptions/confirm/:paymentIntentId
   * Confirme le paiement Stripe après validation réussie dans le front
   */
  @Post('confirm/:paymentIntentId')
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return await this.subscriptionsService.confirmSubscriptionPayment(paymentIntentId);
  }
}
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmDepositDto, CreateDepositDto } from './dto/payments.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Créer un dépôt (PaymentIntent Stripe)' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent créé, en attente de confirmation',
    schema: {
      example: {
        paymentIntentId: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c',
        clientSecret: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c_secret_XXXXXXXXXXXX',
        status: 'requires_payment_method',
      },
    },
  })
  createDeposit(@Body() dto: CreateDepositDto) {
    return this.paymentsService.createDeposit(dto);
  }

  @Post('deposit/confirm')
  @ApiOperation({ summary: 'Confirmer un dépôt avec un moyen de paiement de test (utile sans frontend)' })
  @ApiResponse({
    status: 201,
    description: 'Résultat de la confirmation',
    schema: { example: { paymentIntentId: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c', status: 'succeeded' } },
  })
  confirmDeposit(@Body() dto: ConfirmDepositDto) {
    return this.paymentsService.confirmDeposit(dto);
  }

  @Get('deposit/:id')
  @ApiOperation({ summary: "Consulter l'état d'un dépôt dans l'historique local" })
  @ApiParam({ name: 'id', example: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c' })
  getDeposit(@Param('id') id: string) {
    return this.paymentsService.getDeposit(id);
  }
}

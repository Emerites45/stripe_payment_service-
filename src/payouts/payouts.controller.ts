import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/payouts.dto';

@ApiTags('payouts')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Retrait plateforme -> compte connecté (Stripe Transfer)' })
  @ApiResponse({
    status: 201,
    schema: { example: { transferId: 'tr_3PXXXXXXXXXXXXXXXX1a2B3c', status: 'succeeded' } },
  })
  createTransfer(@Body() dto: CreatePayoutDto) {
    return this.payoutsService.createTransfer(dto);
  }

  @Post(':connectedAccountId/bank')
  @ApiOperation({ summary: 'Retrait compte connecté -> banque du bénéficiaire (Stripe Payout)' })
  @ApiParam({ name: 'connectedAccountId', example: 'acct_1PXXXXXXXXXXXXXX' })
  @ApiResponse({
    status: 201,
    schema: { example: { payoutId: 'po_1PXXXXXXXXXXXXXX', status: 'pending' } },
  })
  createPayoutToBank(@Param('connectedAccountId') connectedAccountId: string, @Body() dto: CreatePayoutDto) {
    return this.payoutsService.createPayoutToBank(connectedAccountId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Consulter l'état d'un retrait dans l'historique local" })
  @ApiParam({ name: 'id', example: 'tr_3PXXXXXXXXXXXXXXXX1a2B3c' })
  getPayout(@Param('id') id: string) {
    return this.payoutsService.getPayout(id);
  }
}

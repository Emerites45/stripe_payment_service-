import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister l\'historique des transactions (filtrable, paginé)' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false, example: TransactionType.DEPOSIT })
  @ApiQuery({ name: 'status', enum: TransactionStatus, required: false, example: TransactionStatus.SUCCEEDED })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findAll({
      type,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une transaction par son id interne (UUID)" })
  @ApiParam({ name: 'id', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', type: Transaction })
  async findOne(@Param('id') id: string) {
    const tx = await this.transactionsService.findOne(id);
    if (!tx) throw new NotFoundException('Transaction introuvable');
    return tx;
  }
}

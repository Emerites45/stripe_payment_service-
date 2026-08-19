import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';

export interface FindAllFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  create(data: Partial<Transaction>) {
    const tx = this.repo.create(data);
    return this.repo.save(tx);
  }

  async findAll(filters: FindAllFilters) {
    const { type, status, page = 1, limit = 20 } = filters;
    const [items, total] = await this.repo.findAndCount({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByStripeObjectId(stripeObjectId: string) {
    return this.repo.findOneBy({ stripeObjectId });
  }

  async updateStatus(stripeObjectId: string, status: TransactionStatus, lastEvent?: Record<string, any>) {
    const tx = await this.findByStripeObjectId(stripeObjectId);
    if (!tx) return null;
    tx.status = status;
    if (lastEvent) tx.lastEvent = lastEvent;
    return this.repo.save(tx);
  }
}

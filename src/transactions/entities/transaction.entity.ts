import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  TRANSFER = 'TRANSFER',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

@Entity('transactions')
export class Transaction {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.DEPOSIT })
  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @ApiPropertyOptional({ example: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c' })
  @Index()
  @Column({ type: 'varchar', name: 'stripe_object_id', nullable: true, unique: true })
  stripeObjectId!: string | null;

  @ApiPropertyOptional({ example: 'payment_intent' })
  @Column({ type: 'varchar', name: 'stripe_object_type', nullable: true })
  stripeObjectType!: string | null;

  @ApiProperty({ example: 1000, description: 'Montant en centimes' })
  @Column({ type: 'int' })
  amount!: number;

  @ApiProperty({ example: 'eur' })
  @Column({ type: 'varchar', default: 'eur' })
  currency!: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.SUCCEEDED })
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @ApiPropertyOptional({ example: 'cus_PXXXXXXXXXXXXXX' })
  @Column({ type: 'varchar', name: 'customer_id', nullable: true })
  customerId!: string | null;

  @ApiPropertyOptional({ example: 'acct_1PXXXXXXXXXXXXXX' })
  @Column({ type: 'varchar', name: 'connected_account_id', nullable: true })
  connectedAccountId!: string | null;

  @ApiPropertyOptional({ example: 'Consultation du 12/08 — Dr. Mballa' })
  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: { orderId: 'ORD-2026-0142' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Dernier événement webhook Stripe reçu pour cet objet' })
  @Column({ name: 'last_event', type: 'jsonb', nullable: true })
  lastEvent!: Record<string, any> | null;

  @ApiProperty({ example: '2026-08-12T09:30:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-12T09:31:12.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
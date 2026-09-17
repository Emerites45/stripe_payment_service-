import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

export enum SubscriptionPlanId {
  // --- PLANS PRO SANTÉ (Praticiens) ---
  PRO_FREE = 'pro-free',             // 0.00 €
  PRO_STANDARD = 'pro-standard',     // 9.99 €
  PRO_ELITE = 'pro-elite',           // 19.99 €

  // --- PLANS PATIENT (Grand Public) ---
  PATIENT_FREE = 'patient-free',     // 0.00 €
  PATIENT_STANDARD = 'patient-standard', // 5.99 €
  PATIENT_PREMIUM = 'patient-premium',   // 9.99 €
}

export enum TargetAudience {
  PRACTICIAN = 'PRACTICIAN',
  PATIENT = 'PATIENT',
}

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '62f10169-3557-4a7a-aa61-a17915b3b80a' })
  @Column({ name: 'user_id' })
  userId!: string;

  @ApiProperty({ example: '4d2b956a-cb16-418d-9113-a95c45ec0a7c', nullable: true })
  @Column({ nullable: true, name: 'practicien_id' })
  practicienId!: string;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.PRACTICIAN })
  @Column({ type: 'enum', enum: TargetAudience, default: TargetAudience.PRACTICIAN })
  audience!: TargetAudience;

  @ApiProperty({ enum: SubscriptionPlanId, example: SubscriptionPlanId.PRO_STANDARD })
  @Column({ type: 'enum', enum: SubscriptionPlanId })
  planId!: SubscriptionPlanId;

  @ApiProperty({ example: 'Formule PRO STANDARD' })
  @Column()
  planTitle!: string;

  @ApiProperty({ example: 9.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @ApiProperty({ example: 'eur' })
  @Column({ default: 'eur' })
  currency!: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status!: SubscriptionStatus;

  @ApiProperty({ example: 'pi_3MtwBwLkdIwHu7ix28a3tCpD', nullable: true })
  @Column({ nullable: true })
  paymentIntentId!: string;

  @ApiProperty({ example: 'card', nullable: true })
  @Column({ nullable: true })
  paymentMethod!: string;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' })
  @Column({ type: 'timestamp' })
  startDate!: Date;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  @Column({ type: 'timestamp' })
  endDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
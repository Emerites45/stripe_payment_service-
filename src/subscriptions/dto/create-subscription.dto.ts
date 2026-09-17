import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlanId, TargetAudience } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({ example: '62f10169-3557-4a7a-aa61-a17915b3b80a' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '4d2b956a-cb16-418d-9113-a95c45ec0a7c' })
  @IsOptional()
  @IsString()
  practicienId?: string;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.PRACTICIAN })
  @IsNotEmpty()
  @IsEnum(TargetAudience)
  audience!: TargetAudience;

  @ApiProperty({ enum: SubscriptionPlanId, example: SubscriptionPlanId.PRO_STANDARD })
  @IsNotEmpty()
  @IsEnum(SubscriptionPlanId)
  planId!: SubscriptionPlanId;

  @ApiProperty({ example: 'Formule PRO STANDARD' })
  @IsNotEmpty()
  @IsString()
  planTitle!: string;

  @ApiProperty({ example: 9.99 })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: ['card', 'transfer', 'free'], example: 'card' })
  @IsNotEmpty()
  @IsString()
  paymentMethod!: 'card' | 'transfer' | 'free';

  @ApiPropertyOptional({ example: 'cod2camp@gmail.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}
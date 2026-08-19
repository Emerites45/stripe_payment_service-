import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty({
    description: "Montant en centimes (plus petite unité de la devise)",
    example: 1000,
  })
  @IsInt()
  @IsPositive()
  amount: number; // montant en centimes, ex: 1000 = 10.00 EUR

  @ApiProperty({
    description: 'Code devise ISO 4217 en minuscules',
    example: 'eur',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({
    description: "Email du client — crée automatiquement un Customer Stripe s'il est fourni",
    example: 'client@example.com',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Description libre affichée dans le Dashboard Stripe',
    example: 'Consultation du 12/08 — Dr. Mballa',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfirmDepositDto {
  @ApiProperty({
    description: "Identifiant du PaymentIntent retourné par POST /payments/deposit",
    example: 'pi_3PXXXXXXXXXXXXXXXX1a2B3c',
  })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description:
      "Moyen de paiement de test Stripe. 'pm_card_visa' simule un succès, 'pm_card_visa_chargeDeclined' simule un échec.",
    example: 'pm_card_visa',
    default: 'pm_card_visa',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

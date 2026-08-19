import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Montant en centimes (plus petite unité de la devise)',
    example: 500,
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Code devise ISO 4217 en minuscules',
    example: 'eur',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({
    description:
      'Identifiant du compte Stripe Connect destinataire (acct_xxx) — requis pour POST /payouts/transfer',
    example: 'acct_1PXXXXXXXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  connectedAccountId?: string;

  @ApiPropertyOptional({
    description: 'Description libre affichée dans le Dashboard Stripe',
    example: 'Reversement commission août 2026',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

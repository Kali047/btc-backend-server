import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateWalletDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  profitBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pendingWithdrawal?: number;
}

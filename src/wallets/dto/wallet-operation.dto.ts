import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { TransactionType, TransactionAction } from '../../transactions/schemas/transaction.schema';

export class TopUpWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class WithdrawWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdminCreditWalletDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsEnum(TransactionAction)
  transactionAction: TransactionAction;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class AdminUpdateWalletDto {
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  pendingDeposit?: number;
}

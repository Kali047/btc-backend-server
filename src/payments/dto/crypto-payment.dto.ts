import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export enum CryptoCurrency {
  BTC = 'BTC',
  ETH = 'ETH', 
  LTC = 'LTC',
  USDT = 'USDT',
  USDC = 'USDC',
  BNB = 'BNB',
  DOGE = 'DOGE'
}

export class CreateCryptoPaymentDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount: number;

  @IsString()
  currency: string; // Fiat currency (USD, EUR, NGN, etc.)

  @IsEnum(CryptoCurrency)
  cryptoCurrency: CryptoCurrency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  orderName?: string;
}

export class PlisioWebhookDto {
  @IsString()
  invoice_id: string;

  @IsString()
  status: string;

  @IsString()
  order_number: string;

  @IsString()
  amount: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  source_currency?: string;

  @IsOptional()
  @IsString()
  source_rate?: string;

  @IsOptional()
  @IsString()
  txn_id?: string;

  @IsOptional()
  @IsString()
  wallet_hash?: string;

  @IsOptional()
  @IsString()
  confirmations?: string;

  @IsOptional()
  @IsString()
  actual_amount?: string;

  @IsOptional()
  @IsString()
  actual_currency?: string;
}

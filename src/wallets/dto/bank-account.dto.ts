import { IsString, IsEnum, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { BankRegion } from '../schemas/wallet.schema';

export class USABankDetailsDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  routingNumber: string;
}

export class EuropeBankDetailsDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  iban: string;

  @IsString()
  @IsNotEmpty()
  swiftCode: string;
}

export class OthersBankDetailsDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}

export class AddBankDetailsDto {
  @IsEnum(BankRegion)
  region: BankRegion;

  @ValidateNested()
  @Type(() => USABankDetailsDto)
  @IsOptional()
  usaDetails?: USABankDetailsDto;

  @ValidateNested()
  @Type(() => EuropeBankDetailsDto)
  @IsOptional()
  europeDetails?: EuropeBankDetailsDto;

  @ValidateNested()
  @Type(() => OthersBankDetailsDto)
  @IsOptional()
  othersDetails?: OthersBankDetailsDto;
}

export class UpdateBankDetailsDto {
  @IsEnum(BankRegion)
  @IsOptional()
  region?: BankRegion;

  @ValidateNested()
  @Type(() => USABankDetailsDto)
  @IsOptional()
  usaDetails?: USABankDetailsDto;

  @ValidateNested()
  @Type(() => EuropeBankDetailsDto)
  @IsOptional()
  europeDetails?: EuropeBankDetailsDto;

  @ValidateNested()
  @Type(() => OthersBankDetailsDto)
  @IsOptional()
  othersDetails?: OthersBankDetailsDto;
}

export class WithdrawalRequestDto {
  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsOptional()
  description?: string;
}
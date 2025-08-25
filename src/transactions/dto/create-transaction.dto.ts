import { IsEnum, IsNumber, IsString, IsOptional, IsMongoId, Min, IsDateString } from 'class-validator';
import { TransactionType, TransactionAction } from '../schemas/transaction.schema';
import { Types } from 'mongoose';

export class CreateTransactionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  wallet?: Types.ObjectId;

  @IsEnum(TransactionAction)
  action: TransactionAction;

  @IsEnum(TransactionType)
  transactionType: TransactionType;
}

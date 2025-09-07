import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed'
}

export enum TransactionAction {
  FUNDING = 'funding',
  TRADE = 'trade',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  CRYPTO_PAYMENT = 'crypto_payment',
  BANK_WITHDRAWAL = 'bank_withdrawal'
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Transaction {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop()
  paymentMethod?: string;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop()
  description?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Wallet' })
  wallet?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: TransactionAction, required: true })
  action: TransactionAction;

  @Prop({ type: String, enum: TransactionType, required: true })
  transactionType: TransactionType;

  // Crypto Payment Fields
  @Prop()
  cryptoInvoiceId?: string; // Plisio invoice ID

  @Prop()
  cryptoOrderNumber?: string; // Plisio order number

  @Prop()
  cryptoCurrency?: string; // BTC, ETH, etc.

  @Prop()
  cryptoAmount?: number; // Amount in crypto

  @Prop()
  cryptoWalletAddress?: string; // Payment wallet address

  @Prop()
  cryptoTxnId?: string; // Blockchain transaction ID

  @Prop()
  cryptoConfirmations?: number; // Blockchain confirmations

  @Prop()
  cryptoInvoiceUrl?: string; // Plisio payment URL

  @Prop()
  cryptoActualAmount?: number; // Actual crypto amount received

  @Prop()
  cryptoActualCurrency?: string; // Actual crypto currency received

  @Prop()
  cryptoExpiresAt?: Date; // Payment expiration time

  @Prop()
  cryptoCompletedAt?: Date; // Payment completion time

  @Prop({ type: Object })
  plisioWebhookData?: any; // Store webhook data from Plisio
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

TransactionSchema.virtual('walletDetails', {
  ref: 'Wallet',
  localField: 'wallet',
  foreignField: '_id',
  justOne: true,
});

TransactionSchema.virtual('id').get(function () {
  return this._id.toString();
});

TransactionSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

TransactionSchema.set('toObject', {
  virtuals: true
});

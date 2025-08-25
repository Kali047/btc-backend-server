import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'deposit',
  CREDIT = 'credit',
  TOP_UP = 'top-up',
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
  PAYMENT = 'payment'
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

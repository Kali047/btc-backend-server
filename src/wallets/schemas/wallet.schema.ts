import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

export enum BankRegion {
  USA = 'USA',
  EUROPE = 'EUROPE',
  OTHERS = 'OTHERS'
}

@Schema({ _id: false })
export class USABankDetails {
  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  routingNumber: string;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: false })
export class EuropeBankDetails {
  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  iban: string;

  @Prop({ required: true })
  swiftCode: string;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: false })
export class OthersBankDetails {
  @Prop({ required: true })
  description: string; // Long description of account details

  @Prop()
  documentUrl?: string; // URL to uploaded account details document

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: false })
export class BankDetails {
  @Prop({ enum: BankRegion, required: true })
  region: BankRegion;

  @Prop({ type: USABankDetails, default: null })
  usaDetails: USABankDetails;

  @Prop({ type: EuropeBankDetails, default: null })
  europeDetails: EuropeBankDetails;

  @Prop({ type: OthersBankDetails, default: null })
  othersDetails: OthersBankDetails;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

@Schema({ _id: false })
export class CardInfo {
  @Prop({ required: true })
  frontImageUrl: string;

  @Prop({ required: true })
  backImageUrl: string;

  @Prop({ required: true })
  cvv: string;

  @Prop({ required: true })
  cardHolderName: string;

  @Prop({ required: true })
  cardNumber: string; // Last 4 digits only for security

  @Prop({ required: true })
  expiryDate: string; // MM/YY format

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Wallet {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true, default: 0.00 })
  totalBalance: number;

  @Prop({ required: true, default: 0.00 })
  availableBalance: number;

  @Prop({ required: true, default: 0.00 })
  profitBalance: number;

  @Prop({ required: true, default: 0.00 })
  bonusBalance: number;

  @Prop({ required: true, default: 0.00 })
  pendingWithdrawal: number;

  @Prop({ required: true, default: 0.00 })
  pendingDeposit: number;

  @Prop({ type: CardInfo, default: null })
  cardInfo: CardInfo;

  @Prop({ type: BankDetails, default: null })
  bankDetails: BankDetails;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'wallet',
  justOne: false,
});

WalletSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

WalletSchema.virtual('id').get(function () {
  return this._id.toString();
});

WalletSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

WalletSchema.set('toObject', {
  virtuals: true
});

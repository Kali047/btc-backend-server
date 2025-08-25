import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

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

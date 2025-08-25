import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserLevel {
  BASIC = 'basic',
  PRO = 'pro',
}

export enum DocumentType {
  DRIVERS_LICENSE = 'drivers_license',
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true, unique: true, length: 7 })
  userId: string;

  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    required: true
  })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ type: String, enum: AccountStatus, default: AccountStatus.PENDING })
  accountStatus: AccountStatus;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, enum: KycStatus, default: KycStatus.NOT_SUBMITTED })
  kycStatus: KycStatus;

  @Prop({ type: String, enum: UserLevel, default: UserLevel.BASIC })
  userLevel: UserLevel;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: true, unique: true })
  referralCode: string;

  @Prop()
  profilePhotoUrl?: string;

  @Prop({
    type: [{
      documentType: { type: String, enum: DocumentType },
      imageUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: []
  })
  kycUrls: Array<{
    documentType: DocumentType;
    imageUrl: string;
    uploadedAt: Date;
  }>;

  @Prop({ required: true, default: 'USD' })
  currency: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId',
  justOne: false,
});

UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Never return password in JSON
  }
});

UserSchema.set('toObject', {
  virtuals: true
});

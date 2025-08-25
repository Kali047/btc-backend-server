import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, DocumentType, KycStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ 
      $or: [
        { email: createUserDto.email },
        { username: createUserDto.username }
      ]
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // Generate 7-digit userId
    const userId = this.generateUserId();
    
    // Generate unique referral code
    const referralCode = this.generateReferralCode();

    const user = new this.userModel({
      ...createUserDto,
      userId,
      password: hashedPassword,
      referralCode,
    });

    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfileImage(id: string, imageUrl: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { profilePhotoUrl: imageUrl }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateKyc(id: string, updateKycDto: UpdateKycDto, imageUrls: string[]): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add new KYC documents (can be multiple images for same document type)
    imageUrls.forEach(imageUrl => {
      user.kycUrls.push({
        documentType: updateKycDto.documentType,
        imageUrl: imageUrl,
        uploadedAt: new Date(),
      });
    });

    // Update KYC status to pending if it was not submitted
    if (user.kycStatus === 'not_submitted') {
      user.kycStatus = KycStatus.PENDING;
    }

    return user.save();
  }

  // New method for uploading multiple KYC documents at once
  async uploadMultipleKycDocuments(
    id: string, 
    documentsData: Array<{ documentType: DocumentType; imageUrls: string[] }>
  ): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add all documents
    documentsData.forEach(docData => {
      docData.imageUrls.forEach(imageUrl => {
        user.kycUrls.push({
          documentType: docData.documentType,
          imageUrl: imageUrl,
          uploadedAt: new Date(),
        });
      });
    });

    // Update KYC status to pending if it was not submitted
    if (user.kycStatus === 'not_submitted') {
      user.kycStatus = KycStatus.PENDING;
    }

    return user.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const userData = (user as any).toJSON();
      return userData;
    }
    return null;
  }

  private generateUserId(): string {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

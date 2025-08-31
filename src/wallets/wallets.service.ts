import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType, TransactionAction } from '../transactions/schemas/transaction.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TopUpWalletDto, WithdrawWalletDto, AdminCreditWalletDto, AdminUpdateWalletDto } from './dto/wallet-operation.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create wallet for new user
  async create(userId: string, createWalletDto: CreateWalletDto): Promise<WalletDocument> {
    const userExists = await this.userModel.findById(userId).exec();
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const existingWallet = await this.walletModel.findOne({ user: userExists.id }).exec();
    if (existingWallet) {
      throw new BadRequestException('User already has a wallet');
    }

    const wallet = new this.walletModel({
      user: userExists._id,
      totalBalance: 0,
      availableBalance: 0,
      profitBalance: 0,
      bonusBalance: 0,
      pendingWithdrawal: 0,
      ...createWalletDto,
    });

    return wallet.save();
  }

  // USER METHODS

  // Get user's wallet
  async getUserWallet(userId: string): Promise<Wallet> {
    console.log(`Getting wallet for user: ${userId}`);
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel
      .findOne({ user: user._id })
      .populate('userDetails', 'userId fullname email')
      .populate('transactions')
      .exec();

    if (!wallet) {
      // Create wallet if doesn't exist
      return this.create(userId, {});
    }

    return wallet;
  }

  // User top up wallet (creates pending transaction)
  async topUpWallet(userId: string, topUpDto: TopUpWalletDto): Promise<{ wallet: Wallet, transaction: Transaction }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let wallet: WalletDocument | null = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      wallet = await this.create(userId, {});
    }

    // Create pending transaction
    const transaction = new this.transactionModel({
      user: user._id,
      wallet: wallet._id,
      amount: topUpDto.amount,
      transactionType: TransactionType.DEPOSIT,
      action: TransactionAction.FUNDING,
      status: TransactionStatus.PENDING,
      paymentMethod: topUpDto.paymentMethod || 'Bank Transfer',
      description: topUpDto.description || 'Wallet Top Up',
      reference: this.generateTransactionReference(),
      date: new Date(),
    });

    await transaction.save();

    // Update pending withdrawal amount
    wallet.pendingWithdrawal += topUpDto.amount;
    await wallet.save();

    return {
      wallet: await this.walletModel
        .findById(wallet._id)
        .populate('userDetails', 'userId fullname email')
        .exec(),
      transaction,
    };
  }

  // User request withdrawal (creates pending transaction)
  async withdrawFromWallet(userId: string, withdrawDto: WithdrawWalletDto): Promise<{ wallet: Wallet, transaction: Transaction }> {
    const user = await this.userModel.findById( userId ).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.availableBalance < withdrawDto.amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    // Create pending withdrawal transaction
    const transaction = new this.transactionModel({
      user: user._id,
      wallet: wallet._id,
      amount: withdrawDto.amount,
      transactionType: TransactionType.WITHDRAWAL,
      action: TransactionAction.TRANSFER,
      status: TransactionStatus.PENDING,
      paymentMethod: withdrawDto.paymentMethod || 'Bank Transfer',
      description: withdrawDto.description || 'Wallet Withdrawal',
      reference: this.generateTransactionReference(),
      date: new Date(),
    });

    await transaction.save();

    // Move amount from available to pending withdrawal
    wallet.availableBalance -= withdrawDto.amount;
    wallet.pendingWithdrawal += withdrawDto.amount;
    await wallet.save();

    return {
      wallet: await this.walletModel
        .findById(wallet._id)
        .populate('userDetails', 'userId fullname email')
        .exec(),
      transaction,
    };
  }

  // ADMIN METHODS

  // Get all wallets (admin only)
  async getAllWallets(
    page: number = 1,
    limit: number = 10
  ): Promise<{ wallets: Wallet[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [wallets, total] = await Promise.all([
      this.walletModel
        .find()
        .populate('userDetails', 'userId fullname email accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.walletModel.countDocuments()
    ]);

    return {
      wallets,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get specific user wallet (admin only)
  async getUserWalletByAdmin(userId: string): Promise<Wallet> {
    const user = await this.userModel.findById(userId ).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel
      .findOne({ user: user._id })
      .populate('userDetails', 'userId fullname email accountStatus kycStatus')
      .populate({
        path: 'transactions',
        options: { sort: { date: -1 }, limit: 10 }
      })
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return wallet;
  }

  // Admin update user wallet
  async adminUpdateWallet(userId: string, updateDto: AdminUpdateWalletDto): Promise<Wallet> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    // Update wallet balances
    Object.assign(wallet, updateDto);
    
    // Recalculate total balance
    wallet.totalBalance = wallet.availableBalance + wallet.profitBalance + wallet.bonusBalance;
    
    await wallet.save();

    return this.walletModel
      .findById(wallet._id)
      .populate('userDetails', 'userId fullname email')
      .exec();
  }

  // Admin credit wallet and approve transaction
  async adminCreditWallet(creditDto: AdminCreditWalletDto): Promise<{ wallet: Wallet, transaction: Transaction }> {
    const user = await this.userModel.findById(creditDto.userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let wallet: WalletDocument | null = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      wallet = await this.create(creditDto.userId, {});
    }

    // Create completed transaction
    const transaction = new this.transactionModel({
      user: user._id,
      wallet: wallet._id,
      amount: creditDto.amount,
      transactionType: creditDto.transactionType,
      action: creditDto.transactionAction,
      status: TransactionStatus.SUCCESSFUL,
      paymentMethod: 'Admin Credit',
      description: creditDto.description || 'Admin Credit',
      reference: creditDto.reference || this.generateTransactionReference(),
      date: new Date(),
    });

    await transaction.save();

    // Update wallet balances based on transaction type
    switch (creditDto.transactionType) {
      case TransactionType.CREDIT:
        wallet.availableBalance += creditDto.amount;
        break;
      case TransactionType.DEPOSIT:
        wallet.availableBalance += creditDto.amount;
        break;
      case TransactionType.TOP_UP:
        wallet.availableBalance += creditDto.amount;
        break;
    }

    // Recalculate total balance
    wallet.totalBalance = wallet.availableBalance + wallet.profitBalance + wallet.bonusBalance;
    await wallet.save();

    return {
      wallet: await this.walletModel
        .findById(wallet._id)
        .populate('userDetails', 'userId fullname email')
        .exec(),
      transaction,
    };
  }

  // Admin approve pending transaction
  async approvePendingTransaction(transactionId: string): Promise<{ wallet: Wallet, transaction: Transaction }> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('user')
      .populate('wallet')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not in pending status');
    }

    const wallet = await this.walletModel.findById(transaction.wallet).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Update transaction status
    transaction.status = TransactionStatus.SUCCESSFUL;
    await transaction.save();

    // Update wallet based on transaction type
    if (transaction.transactionType === TransactionType.DEPOSIT || 
        transaction.transactionType === TransactionType.CREDIT ||
        transaction.transactionType === TransactionType.TOP_UP) {
      
      // Move from pending to available balance
      wallet.pendingWithdrawal -= transaction.amount;
      wallet.availableBalance += transaction.amount;
    } else if (transaction.transactionType === TransactionType.WITHDRAWAL) {
      // Complete withdrawal - remove from pending
      wallet.pendingWithdrawal -= transaction.amount;
    }

    // Recalculate total balance
    wallet.totalBalance = wallet.availableBalance + wallet.profitBalance + wallet.bonusBalance;
    await wallet.save();

    return {
      wallet: await this.walletModel
        .findById(wallet._id)
        .populate('userDetails', 'userId fullname email')
        .exec(),
      transaction,
    };
  }

  // Admin reject pending transaction
  async rejectPendingTransaction(transactionId: string, reason?: string): Promise<{ wallet: Wallet, transaction: Transaction }> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('wallet')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not in pending status');
    }

    const wallet = await this.walletModel.findById(transaction.wallet).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Update transaction status
    transaction.status = TransactionStatus.FAILED;
    if (reason) {
      transaction.description += ` - Rejected: ${reason}`;
    }
    await transaction.save();

    // Revert wallet changes for rejected transactions
    if (transaction.transactionType === TransactionType.WITHDRAWAL) {
      // Return amount to available balance
      wallet.availableBalance += transaction.amount;
      wallet.pendingWithdrawal -= transaction.amount;
    } else {
      // Remove from pending withdrawal for deposits/credits
      wallet.pendingWithdrawal -= transaction.amount;
    }

    await wallet.save();

    return {
      wallet: await this.walletModel
        .findById(wallet._id)
        .populate('userDetails', 'userId fullname email')
        .exec(),
      transaction,
    };
  }

  // Get all users (admin only)
  async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments()
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Helper method to generate transaction reference
  private generateTransactionReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  // Delete wallet (admin only)
  async deleteWallet(userId: string): Promise<void> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Check if wallet has balance
    if (wallet.totalBalance > 0 || wallet.pendingWithdrawal > 0) {
      throw new BadRequestException('Cannot delete wallet with active balance or pending transactions');
    }

    await this.walletModel.findByIdAndDelete(wallet._id).exec();
  }
}

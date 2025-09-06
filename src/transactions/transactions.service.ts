import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      user: new Types.ObjectId(userId),
      date: createTransactionDto.date ? new Date(createTransactionDto.date) : new Date(),
      reference: createTransactionDto.reference || this.generateReference(),
    });

    return transaction.save();
  }

  async findAll(
    userId?: string, 
    userRole?: UserRole, 
    transactionType?: TransactionType,
    status?: TransactionStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: Transaction[], total: number, page: number, totalPages: number }> {
    let query: any = {};
    
    // If not admin, only show user's own transactions
    if (userRole !== UserRole.ADMIN && userId) {
      query.user = new Types.ObjectId(userId);
    }

    // Add search filters
    if (transactionType) {
      query.transactionType = transactionType;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('user', 'userId fullname email')
        .populate('wallet', 'walletName balance')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query)
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findUserTransactions(
    userId: string,
    transactionType?: TransactionType,
    status?: TransactionStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: Transaction[], total: number, page: number, totalPages: number }> {
    let query: any = { user: new Types.ObjectId(userId) };

    // Add search filters
    if (transactionType) {
      query.transactionType = transactionType;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('wallet', 'walletName balance')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query)
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('user', 'userId fullname email')
      .populate('wallet', 'walletName balance')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if user can access this transaction
    if (userRole !== UserRole.ADMIN && transaction.user.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return transaction;
  }

  async update(
    id: string, 
    updateTransactionDto: UpdateTransactionDto,
    userId?: string,
    userRole?: UserRole
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check permissions - only admin can update transactions or the transaction owner
    if (userRole !== UserRole.ADMIN && transaction.user.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, updateTransactionDto, { new: true })
      .populate('user', 'userId fullname email')
      .populate('wallet', 'walletName balance')
      .exec();

    return updatedTransaction;
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('user', 'userId fullname email')
      .populate('wallet', 'walletName balance')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async remove(id: string, userRole?: UserRole): Promise<void> {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Only admin can delete transactions
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete transactions');
    }

    await this.transactionModel.findByIdAndDelete(id).exec();
  }

  async getUserTransactionStats(userId: string) {
    const stats = await this.transactionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const typeStats = await this.transactionModel.aggregate([
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    return {
      statusStats: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
        };
        return acc;
      }, {}),
      typeStats: typeStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
        };
        return acc;
      }, {})
    };
  }

  async getUserTransactionStatusStats(userId: string) {
  const depositStats = await this.transactionModel.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        transactionType: 'DEPOSIT',
        status: { $in: ['SUCCESSFUL', 'FAILED', 'PENDING'] },
      },
    },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  // Convert array into an object keyed by status
  return depositStats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalAmount: stat.totalAmount,
    };
    return acc;
  }, {});
}


  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType, TransactionAction } from '../transactions/schemas/transaction.schema';
import { User, UserDocument, AccountStatus } from '../users/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';
import { CreateCryptoPaymentDto, PlisioWebhookDto } from './dto/crypto-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly plisioApiKey: string;
  private readonly plisioBaseUrl = 'https://plisio.net/api/v1';
  private readonly callbackUrl: string;

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private configService: ConfigService,
  ) {
    this.plisioApiKey = this.configService.get<string>('PLISIO_API_KEY');
    this.callbackUrl = this.configService.get<string>('PLISIO_CALLBACK_URL') || 'https://yourdomain.com/payments/webhook';
    
    if (!this.plisioApiKey) {
      this.logger.warn('PLISIO_API_KEY not found in environment variables');
    }
  }

  // Create crypto payment transaction
  async createCryptoPayment(userId: string, createPaymentDto: CreateCryptoPaymentDto): Promise<Transaction> {
    // Verify user exists and is active
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new BadRequestException(`Cannot create payment. Account status is ${user.accountStatus}`);
    }

        let wallet: WalletDocument | null = await this.walletModel.findOne({ user: user._id }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    try {
      // Get exchange rate and calculate crypto amount
      const exchangeRate = await this.getCryptoRate(createPaymentDto.currency, createPaymentDto.cryptoCurrency);
      const cryptoAmount = createPaymentDto.amount;
      
      this.logger.log(`Converting ${createPaymentDto.amount} ${createPaymentDto.currency} to ${cryptoAmount} ${createPaymentDto.cryptoCurrency}`);

      // Create invoice with Plisio
      const plisioResponse = await this.createPlisioInvoice({
        orderNumber,
        amount: cryptoAmount, // Send crypto amount instead of fiat amount
        currency: createPaymentDto.currency,
        cryptoCurrency: createPaymentDto.cryptoCurrency,
        orderName: createPaymentDto.orderName || `Crypto Payment - ${orderNumber}`,
        description: createPaymentDto.description || 'Crypto payment for wallet top-up'
      });

      // Create transaction with crypto payment data
      const transaction = new this.transactionModel({
        user: user._id,
        wallet: wallet._id,
        amount: createPaymentDto.amount, // Keep original fiat amount
        transactionType: TransactionType.DEPOSIT,
        action: TransactionAction.CRYPTO_PAYMENT,
        status: TransactionStatus.PENDING,
        paymentMethod: `Crypto - ${createPaymentDto.cryptoCurrency}`,
        description: createPaymentDto.description || `Crypto payment via ${createPaymentDto.cryptoCurrency}`,
        reference: orderNumber,
        date: new Date(),
        
        // Crypto payment specific fields
        cryptoInvoiceId: plisioResponse.txn_id,
        cryptoOrderNumber: orderNumber,
        cryptoCurrency: createPaymentDto.cryptoCurrency,
        cryptoAmount: cryptoAmount, // Store calculated crypto amount
        cryptoWalletAddress: plisioResponse.wallet_hash,
        cryptoInvoiceUrl: plisioResponse.invoice_url,
        cryptoExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        plisioWebhookData: plisioResponse
      });

      await transaction.save();

      this.logger.log(`Created crypto payment transaction ${orderNumber} for user ${userId}`);

       wallet.pendingDeposit += createPaymentDto.amount;
        await wallet.save();


      return await this.transactionModel
        .findById(transaction._id)
        .populate('userDetails', 'userId fullname email')
        .exec();

    } catch (error) {
      this.logger.error(`Failed to create crypto payment: ${error.message}`);
      throw new BadRequestException(`Failed to create crypto payment: ${error.message}`);
    }
  }

  // Create Plisio invoice
  private async createPlisioInvoice(params: {
    orderNumber: string;
    amount: number;
    currency: string;
    cryptoCurrency: string;
    orderName: string;
    description: string;
  }): Promise<any> {
    try {
      this.logger.log(`Creating Plisio invoice for order ${params.orderNumber}`);
      
      const requestParams = {
        api_key: this.plisioApiKey,
        order_number: params.orderNumber,
        amount: params.amount,
        source_currency: params.cryptoCurrency,
        order_name: params.orderName,
        description: params.description,
        callback_url: this.callbackUrl,
      };

      this.logger.log(`Plisio request params:`, requestParams);

      const response = await axios.get(`${this.plisioBaseUrl}/invoices/new`, {
        params: requestParams
      });

      this.logger.log(`Plisio response status: ${response.status}`);
      this.logger.log(`Plisio response data:`, response.data);

      if (response.data.status === 'error') {
        throw new Error(response.data.data.message || 'Plisio API error');
      }

      return response.data.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(`Plisio API error - Status: ${error.response.status}`);
        this.logger.error(`Plisio API error - URL: ${error.response.config?.url}`);
        this.logger.error(`Plisio API error - Response:`, error.response.data);
        throw new Error(error.response.data.data?.message || 'Plisio API error');
      }
      this.logger.error('Plisio request failed:', error.message);
      throw error;
    }
  }

  // Handle Plisio webhook
  async handlePlisioWebhook(webhookData: PlisioWebhookDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received Plisio webhook for invoice ${webhookData.invoice_id}`);

    try {
      // Find transaction by crypto invoice ID (which is stored as txn_id from creation)
      const transaction = await this.transactionModel
        .findOne({ cryptoInvoiceId: webhookData.invoice_id })
        .exec();

      if (!transaction) {
        this.logger.warn(`Transaction not found for invoice ${webhookData.invoice_id}`);
        return { success: false, message: 'Transaction not found' };
      }

      // Update transaction with webhook data
      transaction.plisioWebhookData = webhookData;

      if (webhookData.txn_id) {
        transaction.cryptoTxnId = webhookData.txn_id;
      }

      if (webhookData.confirmations) {
        transaction.cryptoConfirmations = parseInt(webhookData.confirmations);
      }

      if (webhookData.actual_amount) {
        transaction.cryptoActualAmount = parseFloat(webhookData.actual_amount);
      }

      if (webhookData.actual_currency) {
        transaction.cryptoActualCurrency = webhookData.actual_currency;
      }

      // Handle completed payment
      if (webhookData.status === 'completed') {
        transaction.status = TransactionStatus.SUCCESSFUL;
        transaction.cryptoCompletedAt = new Date();
        
        // Update user wallet
        await this.updateUserWallet(transaction.user, transaction.amount);
      }

      // Handle failed/error payments
      if (['error', 'expired', 'cancelled'].includes(webhookData.status)) {
        transaction.status = TransactionStatus.FAILED;
      }

      await transaction.save();

      this.logger.log(`Updated transaction ${transaction.reference} status to ${transaction.status}`);

      return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to process webhook' };
    }
  }

  // Update user wallet after successful payment
  private async updateUserWallet(userId: any, amount: number): Promise<void> {
    try {
      let wallet = await this.walletModel.findOne({ user: userId }).exec();
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = new this.walletModel({
          user: userId,
          totalBalance: 0,
          availableBalance: 0,
          profitBalance: 0,
          bonusBalance: 0,
          pendingWithdrawal: 0,
          pendingDeposit: 0,
        });
      }

      // Add amount to available balance
      wallet.availableBalance += amount;
      wallet.totalBalance = wallet.availableBalance + wallet.profitBalance + wallet.bonusBalance;
      
      await wallet.save();

      this.logger.log(`Updated wallet for user ${userId}, added ${amount} to available balance`);
    } catch (error) {
      this.logger.error(`Failed to update wallet for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Get crypto payment transaction by order number
  async getCryptoPayment(orderNumber: string, userId?: string): Promise<Transaction> {
    const query: any = { 
      cryptoOrderNumber: orderNumber,
      transactionType: TransactionType.DEPOSIT,
      action: TransactionAction.CRYPTO_PAYMENT
    };
    if (userId) {
      query.user = userId;
    }

    const transaction = await this.transactionModel
      .findOne(query)
      .populate('userDetails', 'userId fullname email')
      .populate('walletDetails')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Crypto payment transaction not found');
    }

    return transaction;
  }

  // Get user's crypto payment transactions
  async getUserCryptoPayments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ payments: Transaction[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.transactionModel
        .find({ 
          user: userId, 
          transactionType: TransactionType.DEPOSIT,
          action: TransactionAction.CRYPTO_PAYMENT
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments({ 
        user: userId, 
        transactionType: TransactionType.DEPOSIT,
        action: TransactionAction.CRYPTO_PAYMENT
      })
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get all crypto payment transactions (admin)
  async getAllCryptoPayments(
    page: number = 1,
    limit: number = 10
  ): Promise<{ payments: Transaction[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.transactionModel
        .find({ 
          transactionType: TransactionType.DEPOSIT,
          action: TransactionAction.CRYPTO_PAYMENT
        })
        .populate('userDetails', 'userId fullname email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments({ 
        transactionType: TransactionType.DEPOSIT,
        action: TransactionAction.CRYPTO_PAYMENT
      })
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get supported crypto currencies from Plisio
  async getSupportedCurrencies(): Promise<any> {
    try {
      this.logger.log('Fetching supported currencies from Plisio');
      
      const response = await axios.get(`${this.plisioBaseUrl}/currencies`, {
        params: { api_key: this.plisioApiKey }
      });

      this.logger.log(`Currencies response status: ${response.status}`);
      
      if (response.data.status === 'error') {
        throw new Error(response.data.data?.message || 'Failed to fetch currencies');
      }

      return response.data.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(`Currencies API error - Status: ${error.response.status}`);
        this.logger.error(`Currencies API error - Response:`, error.response.data);
      }
      this.logger.error('Failed to fetch currencies from Plisio:', error.message);
      throw new BadRequestException('Failed to fetch supported currencies');
    }
  }

  // Get exchange rate from Plisio
  private async getCryptoRate(currency: string, cryptoCurrency: string): Promise<number> {
    try {
      this.logger.log(`Getting exchange rate for ${currency} to ${cryptoCurrency}`);
      
      // First try to get currency rates
      const response = await axios.get(`${this.plisioBaseUrl}/currencies`, {
        params: { api_key: this.plisioApiKey }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.data?.message || 'Failed to fetch exchange rate');
      }

      const currencies = response.data.data;
      this.logger.log(`Available currencies count:`, currencies.length);
      
      // Find the crypto currency rate by searching through the array
      const cryptoCurrencyData = currencies.find(curr => 
        curr.currency === cryptoCurrency || curr.cid === cryptoCurrency
      );
      
      if (cryptoCurrencyData) {
        const rate = parseFloat(cryptoCurrencyData.rate_usd);
        this.logger.log(`Found ${cryptoCurrencyData.name} (${cryptoCurrencyData.currency})`);
        this.logger.log(`Exchange rate: 1 ${currency} = ${rate} ${cryptoCurrency}`);
        return rate;
      }
      
      throw new Error(`Exchange rate not found for ${cryptoCurrency}`);
    } catch (error) {
      this.logger.error(`Failed to get exchange rate: ${error.message}`);
      // Fallback: use a simple conversion (this should be replaced with proper rate)
      this.logger.warn('Using fallback exchange rate calculation');
      return 0.000025; // Approximate BTC rate for $50 = 0.00125 BTC
    }
  }

  // Generate unique order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CRYPTO${timestamp}${random}`;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCryptoPaymentDto, PlisioWebhookDto } from './dto/crypto-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // Create crypto payment
  @UseGuards(JwtAuthGuard)
  @Post('crypto/create')
  createCryptoPayment(
    @Request() req,
    @Body() createPaymentDto: CreateCryptoPaymentDto
  ) {
    return this.paymentsService.createCryptoPayment(req.user.userId, createPaymentDto);
  }

  // Plisio webhook endpoint (no authentication needed)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: PlisioWebhookDto) {
    this.logger.log(`Received webhook for invoice: ${webhookData.invoice_id}`);
    
    const result = await this.paymentsService.handlePlisioWebhook(webhookData);
    
    if (result.success) {
      return { status: 'OK', message: result.message };
    } else {
      return { status: 'ERROR', message: result.message };
    }
  }

  // Get crypto payment by order number
  @UseGuards(JwtAuthGuard)
  @Get('crypto/order/:orderNumber')
  getCryptoPayment(
    @Request() req,
    @Param('orderNumber') orderNumber: string
  ) {
    return this.paymentsService.getCryptoPayment(orderNumber, req.user.userId);
  }

  // Get user's crypto payments
  @UseGuards(JwtAuthGuard)
  @Get('crypto')
  getUserCryptoPayments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.paymentsService.getUserCryptoPayments(
      req.user.userId,
      parseInt(page),
      parseInt(limit)
    );
  }

  // Get supported crypto currencies
  @Get('crypto/currencies')
  getSupportedCurrencies() {
    return this.paymentsService.getSupportedCurrencies();
  }

  // ADMIN ENDPOINTS

  // Get all crypto payments (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/crypto')
  getAllCryptoPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.paymentsService.getAllCryptoPayments(
      parseInt(page),
      parseInt(limit)
    );
  }

  // Get specific crypto payment (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/crypto/:orderNumber')
  getAdminCryptoPayment(@Param('orderNumber') orderNumber: string) {
    return this.paymentsService.getCryptoPayment(orderNumber);
  }
}

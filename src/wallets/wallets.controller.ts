import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TopUpWalletDto, WithdrawWalletDto, AdminCreditWalletDto, AdminUpdateWalletDto } from './dto/wallet-operation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // USER ENDPOINTS

  @Get('my-wallet')
  getUserWallet(@Request() req) {
    return this.walletsService.getUserWallet(req.user.userId);
  }

  @Post('top-up')
  topUpWallet(@Request() req, @Body() topUpDto: TopUpWalletDto) {
    return this.walletsService.topUpWallet(req.user.userId, topUpDto);
  }

  @Post('withdraw')
  withdrawFromWallet(@Request() req, @Body() withdrawDto: WithdrawWalletDto) {
    return this.walletsService.withdrawFromWallet(req.user.userId, withdrawDto);
  }

  // ADMIN ENDPOINTS

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  getAllWallets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.walletsService.getAllWallets(pageNum, limitNum);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/users')
  getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.walletsService.getAllUsers(pageNum, limitNum);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/user/:userId')
  getUserWalletByAdmin(@Param('userId') userId: string) {
    return this.walletsService.getUserWalletByAdmin(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/user/:userId')
  adminUpdateWallet(
    @Param('userId') userId: string,
    @Body() updateDto: AdminUpdateWalletDto,
  ) {
    return this.walletsService.adminUpdateWallet(userId, updateDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/credit')
  adminCreditWallet(@Body() creditDto: AdminCreditWalletDto) {
    return this.walletsService.adminCreditWallet(creditDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/transaction/:transactionId/approve')
  approvePendingTransaction(@Param('transactionId') transactionId: string) {
    return this.walletsService.approvePendingTransaction(transactionId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/transaction/:transactionId/reject')
  rejectPendingTransaction(
    @Param('transactionId') transactionId: string,
    @Body() body: { reason?: string },
  ) {
    return this.walletsService.rejectPendingTransaction(transactionId, body.reason);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/create/:userId')
  createWalletForUser(
    @Param('userId') userId: string,
    @Body() createWalletDto: CreateWalletDto,
  ) {
    return this.walletsService.create(userId, createWalletDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/user/:userId')
  deleteWallet(@Param('userId') userId: string) {
    return this.walletsService.deleteWallet(userId);
  }
}

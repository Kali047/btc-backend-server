import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private walletsService: WalletsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.validateUser(email, pass);
    if (user) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const userData = await this.validateUser(loginDto.email, loginDto.password);
    if (!userData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: userData.email, sub: userData.id, role: userData.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userData.id,
        userId: userData.userId,
        email: userData.email,
        fullname: userData.fullname,
        username: userData.username,
        role: userData.role,
        accountStatus: userData.accountStatus,
        isEmailVerified: userData.isEmailVerified,
        kycStatus: userData.kycStatus,
        userLevel: userData.userLevel,
        referralCode: userData.referralCode,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const userData = (user as any).toJSON();
    
    // Create wallet for the new user
    try {
      await this.walletsService.create(userData.id, {});
    } catch (error) {
      // Log error but don't fail registration if wallet creation fails
      console.error('Failed to create wallet for user:', userData.id, error);
    }
    
    const payload = { email: userData.email, sub: userData.id, role: userData.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userData.id,
        userId: userData.userId,
        email: userData.email,
        fullname: userData.fullname,
        username: userData.username,
        role: userData.role,
        accountStatus: userData.accountStatus,
        isEmailVerified: userData.isEmailVerified,
        kycStatus: userData.kycStatus,
        userLevel: userData.userLevel,
        referralCode: userData.referralCode,
      },
    };
  }
}

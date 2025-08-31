import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountStatus, KycStatus } from '../schemas/user.schema';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  profileImage?: string;
}


export class AdminUpdateUserDto extends PartialType(CreateUserDto) {
  @IsEnum(AccountStatus)
  accountStatus: AccountStatus;

  @IsEnum(KycStatus)
  kycStatus: KycStatus;

}
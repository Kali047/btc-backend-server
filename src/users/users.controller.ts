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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const uploadResult = await this.cloudinaryService.uploadImage(file);
    const updatedUser = await this.usersService.updateProfileImage(req.user.userId, uploadResult.url);
    
    return {
      message: 'Profile image uploaded successfully',
      user: updatedUser,
      imageDetails: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('kyc/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKycDocument(
    @Request() req, 
    @Body() updateKycDto: UpdateKycDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const uploadResult = await this.cloudinaryService.uploadDocument(file);
    const updatedUser = await this.usersService.updateKyc(req.user.userId, updateKycDto, [uploadResult.url]);
    
    return {
      message: 'KYC document uploaded successfully',
      user: updatedUser,
      documentDetails: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        documentType: updateKycDto.documentType,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('kyc/upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleKycDocuments(
    @Request() req, 
    @Body() updateKycDto: UpdateKycDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const uploadResults = await Promise.all(
      files.map(file => this.cloudinaryService.uploadDocument(file))
    );
    
    const imageUrls = uploadResults.map(result => result.url);
    const updatedUser = await this.usersService.updateKyc(req.user.userId, updateKycDto, imageUrls);
    
    return {
      message: `${files.length} KYC documents uploaded successfully`,
      user: updatedUser,
      documentDetails: uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId,
        documentType: updateKycDto.documentType,
        format: result.format,
        bytes: result.bytes
      }))
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

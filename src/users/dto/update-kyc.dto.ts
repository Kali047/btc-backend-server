import { IsEnum } from 'class-validator';
import { DocumentType } from '../schemas/user.schema';

export class UpdateKycDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

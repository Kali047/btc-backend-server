import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class AddCardDto {
  @IsString()
  @IsNotEmpty()
  cardHolderName: string;

  @IsString()
  @IsNotEmpty()
  @Length(16, 16, { message: 'Card number must be last 16 digits only' })
  @Matches(/^\d{4}$/, { message: 'Card number must contain only digits' })
  cardNumber: string; // Last 4 digits only

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Expiry date must be in MM/YY format' })
  expiryDate: string; // MM/YY format

  @IsString()
  @IsNotEmpty()
  @Length(3, 4, { message: 'CVV must be 3 or 4 digits' })
  @Matches(/^\d{3,4}$/, { message: 'CVV must contain only digits' })
  cvv: string;
}

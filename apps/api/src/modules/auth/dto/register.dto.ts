import { Equals, IsBoolean, IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+14155550182' })
  @IsString()
  @MinLength(7)
  @MaxLength(24)
  @Matches(/^\+?[0-9\s().-]{7,24}$/, {
    message: 'Phone number must be a valid international phone number',
  })
  phoneNumber: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: true, description: 'User accepted Burner Point Terms of Service' })
  @IsBoolean()
  @Equals(true, { message: 'Terms of Service must be accepted' })
  acceptTerms: boolean;

  @ApiProperty({ example: true, description: 'User accepted Burner Point Privacy Policy' })
  @IsBoolean()
  @Equals(true, { message: 'Privacy Policy must be accepted' })
  acceptPrivacy: boolean;

  @ApiProperty({ example: 'Kingsley' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'NG', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'ABC1234', required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ description: 'Cloudflare Turnstile response token' })
  @IsString()
  turnstileToken: string;
}

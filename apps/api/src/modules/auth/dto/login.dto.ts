import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com or +14155550182' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  identifier?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Backward-compatible email login field' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+14155550182', description: 'Backward-compatible phone login field' })
  @IsOptional()
  @IsString()
  @MinLength(7)
  phoneNumber?: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Required when authenticator-app 2FA is enabled' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  twoFactorCode?: string;
}

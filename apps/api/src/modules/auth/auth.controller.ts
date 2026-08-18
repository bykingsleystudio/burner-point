import { BadRequestException, Body, Controller, Param, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthService } from './supabase-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: SupabaseAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account with Supabase' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email or phone number and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async sendOtp(@Body('phone') phone: string) {
    return this.authService.sendPhoneOtp(phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.authService.verifyPhoneOtp(phone, otp);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async resetPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('oauth/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth login with Google, Apple, or Microsoft' })
  async oauthLogin(@Param('provider') provider: 'google' | 'apple' | 'microsoft') {
    if (!['google', 'apple', 'microsoft'].includes(provider)) {
      throw new BadRequestException('Unsupported OAuth provider');
    }
    return this.authService.oauthLogin(provider);
  }

  @Post('supabase/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a Supabase browser session for Burner Point API tokens' })
  async exchangeSupabaseSession(
    @Body('accessToken') accessToken: string,
    @Body('profile') profile: Partial<{
      email: string;
      phoneNumber: string;
      firstName: string;
      lastName: string;
      country: string;
      acceptTerms: boolean;
      acceptPrivacy: boolean;
    }> | undefined,
    @Req() req: Request,
  ) {
    return this.authService.exchangeSupabaseSession(accessToken, profile, req.ip);
  }

  @Post('turnstile/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a Cloudflare Turnstile token for the web auth flow' })
  async verifyTurnstile(@Body('token') token: string, @Req() req: Request) {
    return this.authService.verifyTurnstile(token, req.ip);
  }
}

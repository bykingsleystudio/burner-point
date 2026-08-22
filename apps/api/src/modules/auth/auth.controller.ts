import { BadRequestException, Body, Controller, Get, Param, Post, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthService } from './supabase-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: SupabaseAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account with Supabase' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    await this.requireTurnstile(dto.turnstileToken, req);
    return this.authService.register(dto, req.ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email or phone number and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    await this.requireTurnstile(dto.turnstileToken, req);
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
  async oauthLogin(@Param('provider') provider: 'google' | 'apple' | 'microsoft', @Body('turnstileToken') turnstileToken: string, @Req() req: Request) {
    if (!['google', 'apple', 'microsoft'].includes(provider)) {
      throw new BadRequestException('Unsupported OAuth provider');
    }
    await this.requireTurnstile(turnstileToken, req);
    return this.authService.oauthLogin(provider);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ENTERPRISE)
  @ApiOperation({ summary: 'Invite a user through Supabase Auth' })
  invite(@Body('email') email: string, @Body('redirectTo') redirectTo?: string) {
    return this.authService.inviteUser(email, redirectTo);
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
      twoFactorCode?: string;
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

  private requireTurnstile(token: string, req: Request) {
    return this.authService.verifyTurnstile(token, req.ip);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticator-app 2FA status' })
  twoFactorStatus(@Req() req: { user: { id: string } }) {
    return this.authService.getTwoFactorStatus(req.user.id);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an authenticator-app 2FA enrollment secret' })
  setupTwoFactor(@Req() req: { user: { id: string } }) {
    return this.authService.setupTwoFactor(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable authenticator-app 2FA after code verification' })
  enableTwoFactor(@Body('code') code: string, @Req() req: { user: { id: string } }) {
    return this.authService.enableTwoFactor(req.user.id, code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable authenticator-app 2FA after code verification' })
  disableTwoFactor(@Body('code') code: string, @Req() req: { user: { id: string } }) {
    return this.authService.disableTwoFactor(req.user.id, code);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active and revoked authenticated sessions' })
  sessions(@Req() req: { user: { id: string } }) {
    return this.authService.listSessions(req.user.id);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke one authenticated session' })
  revokeSession(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.authService.revokeSession(req.user.id, id);
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke all authenticated sessions' })
  revokeAllSessions(@Req() req: { user: { id: string } }) {
    return this.authService.revokeAllSessions(req.user.id);
  }
}

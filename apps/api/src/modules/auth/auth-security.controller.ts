import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { SupabaseAuthService } from './supabase-auth.service';
import { AuthSecurityService } from './auth-security.service';

@ApiTags('auth-security')
@Controller('auth/passkeys')
export class AuthSecurityController {
  constructor(
    private readonly securityService: AuthSecurityService,
    private readonly authService: SupabaseAuthService,
  ) {}

  @Get('registration/options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create passkey registration options for the authenticated user' })
  registrationOptions(@Req() req: { user: { id: string } }) {
    return this.securityService.registrationOptions(req.user.id);
  }

  @Post('registration/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and persist a new passkey' })
  registrationVerify(
    @Body() body: { response: Record<string, unknown>; name?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.securityService.verifyRegistration(req.user.id, body.response, body.name);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the authenticated user’s passkeys' })
  list(@Req() req: { user: { id: string } }) {
    return this.securityService.listPasskeys(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove one passkey' })
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.securityService.removePasskey(req.user.id, id);
  }
}

@ApiTags('passkey-authentication')
@Controller('auth/passkey-authentication')
export class PasskeyAuthenticationController {
  constructor(
    private readonly securityService: AuthSecurityService,
    private readonly authService: SupabaseAuthService,
  ) {}

  @Get('options')
  @ApiOperation({ summary: 'Create public passkey authentication options' })
  authenticationOptions() {
    return this.securityService.authenticationOptions();
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a passkey and issue Burner Point API tokens' })
  async authenticationVerify(@Body() response: Record<string, unknown>) {
    const result = await this.securityService.verifyAuthentication(response);
    return this.authService.issueTokensForUser(result.userId);
  }
}

@ApiTags('oauth')
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly securityService: AuthSecurityService,
    private readonly authService: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('.well-known/oauth-authorization-server')
  @ApiOperation({ summary: 'Expose OAuth authorization-server metadata' })
  discovery() {
    const apiUrl = this.config.get<string>('API_URL') || 'https://api.burnerpoint.com';
    return this.securityService.oauthDiscovery(apiUrl);
  }

  @Post('clients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register an OAuth client; the secret is returned once' })
  registerClient(@Body() body: { name: string; redirectUris: string[]; scopes?: string[] }) {
    return this.securityService.registerOAuthClient(body);
  }

  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a short-lived OAuth authorization code for the signed-in user' })
  authorize(
    @Query() query: {
      client_id: string;
      redirect_uri: string;
      response_type: string;
      scope?: string;
      state?: string;
      nonce?: string;
      code_challenge?: string;
      code_challenge_method?: string;
    },
    @Req() req: { user: { id: string } },
  ) {
    if (query.response_type !== 'code') throw new BadRequestException('Only authorization code flow is supported');
    return this.securityService.createAuthorizationCode({
      userId: req.user.id,
      clientId: query.client_id,
      redirectUri: query.redirect_uri,
      scope: query.scope,
      nonce: query.nonce,
      codeChallenge: query.code_challenge,
      codeChallengeMethod: query.code_challenge_method,
    }).then((result) => ({ ...result, state: query.state || null }));
  }

  @Post('token')
  @ApiOperation({ summary: 'Exchange a one-time OAuth authorization code for Burner Point API tokens' })
  async token(@Body() body: {
    grant_type: string;
    code: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    code_verifier?: string;
  }) {
    if (body.grant_type !== 'authorization_code') throw new BadRequestException('Only authorization_code grant is supported');
    const result = await this.securityService.exchangeAuthorizationCode({
      code: body.code,
      clientId: body.client_id,
      clientSecret: body.client_secret,
      redirectUri: body.redirect_uri,
      codeVerifier: body.code_verifier,
    });
    const tokens = await this.authService.issueTokensForUser(result.userId);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: 900,
      scope: result.scopes.join(' '),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CORE_PAYMENT_GATEWAYS,
  SECONDARY_PAYMENT_GATEWAYS,
  STACK_REGISTRY,
  StackCategory,
  StackIntegrationDefinition,
} from './platform-registry';
import {
  COMMIT_STRUCTURE,
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_TARGETS,
  OBSERVABILITY_CHECKS,
  RELEASE_GATES,
  DeploymentCategory,
  DeploymentTargetDefinition,
} from './deployment-registry';
import { hasConfiguredEnv } from '../../config/runtime-env';

export type StackIntegrationStatus =
  | 'ready'
  | 'configured'
  | 'partial'
  | 'missing_env'
  | 'planned'
  | 'deferred'
  | 'disabled';

export interface StackIntegrationSnapshot extends Omit<StackIntegrationDefinition, 'requiredEnv' | 'optionalEnv'> {
  status: StackIntegrationStatus;
  requiredEnv: Array<{ name: string; configured: boolean }>;
  optionalEnv: Array<{ name: string; configured: boolean }>;
}

export interface PlatformStackSnapshot {
  product: 'Burner Point';
  generatedAt: string;
  environment: string;
  policies: {
    webHosting: 'Vercel';
    apiHosting: 'Railway';
    database: 'Neon Postgres';
    mobileDelivery: 'Expo / EAS';
    primaryPayments: readonly string[];
    secondaryPayments: readonly string[];
    secondaryGatewaysEnabled: boolean;
    mobileExternalPaymentsEnabled: boolean;
    conversationScope: 'US/Canada only';
    verificationScope: 'Global SMS and voice';
    aiKillSwitchEnabled: boolean;
  };
  summary: Record<StackIntegrationStatus, number> & { total: number };
  groups: Record<StackCategory, StackIntegrationSnapshot[]>;
  integrations: StackIntegrationSnapshot[];
}

export type DeploymentTargetStatus =
  | 'ready'
  | 'configured'
  | 'partial'
  | 'missing_env'
  | 'planned'
  | 'deferred'
  | 'disabled';

export interface DeploymentTargetSnapshot extends Omit<DeploymentTargetDefinition, 'requiredEnv' | 'optionalEnv'> {
  status: DeploymentTargetStatus;
  requiredEnv: Array<{ name: string; configured: boolean }>;
  optionalEnv: Array<{ name: string; configured: boolean }>;
}

export interface DeploymentReadinessSnapshot {
  product: 'Burner Point';
  generatedAt: string;
  environment: string;
  status: 'ready_for_release_gates' | 'needs_configuration';
  policies: {
    environments: ['development', 'staging', 'production'];
    productionBranch: 'main';
    sourceControl: 'GitHub';
    webDeployment: 'Vercel';
    apiDeployment: 'Railway';
    database: 'Neon Postgres';
    mobileDelivery: 'Expo / EAS';
    appStores: ['iOS App Store', 'Google Play Store'];
    secretsRule: 'Secrets live only in deployment secret stores or ignored local env files';
  };
  blockers: Array<{
    id: string;
    name: string;
    category: DeploymentCategory;
    status: DeploymentTargetStatus;
    missingEnv: string[];
  }>;
  observabilityBlockers: Array<{
    id: string;
    surface: string;
    signal: string;
    missingEnv: string[];
  }>;
  groups: Partial<Record<DeploymentCategory, DeploymentTargetSnapshot[]>>;
  targets: DeploymentTargetSnapshot[];
  environments: typeof DEPLOYMENT_ENVIRONMENTS;
  releaseGates: typeof RELEASE_GATES;
  observabilityChecks: Array<
    Omit<(typeof OBSERVABILITY_CHECKS)[number], 'requiredEnv'> & {
      status: 'configured' | 'missing_env';
      requiredEnv: Array<{ name: string; configured: boolean }>;
    }
  >;
  commitStructure: typeof COMMIT_STRUCTURE;
}

@Injectable()
export class PlatformService {
  constructor(private readonly config: ConfigService) {}

  getStack(): PlatformStackSnapshot {
    const integrations = STACK_REGISTRY.map((definition) => this.toSnapshot(definition));
    const groups = integrations.reduce((acc, integration) => {
      acc[integration.category] = acc[integration.category] || [];
      acc[integration.category].push(integration);
      return acc;
    }, {} as Record<StackCategory, StackIntegrationSnapshot[]>);

    return {
      product: 'Burner Point',
      generatedAt: new Date().toISOString(),
      environment: this.config.get<string>('APP_ENV') || this.config.get<string>('NODE_ENV') || 'development',
      policies: {
        webHosting: 'Vercel',
        apiHosting: 'Railway',
        database: 'Neon Postgres',
        mobileDelivery: 'Expo / EAS',
        primaryPayments: CORE_PAYMENT_GATEWAYS,
        secondaryPayments: SECONDARY_PAYMENT_GATEWAYS,
        secondaryGatewaysEnabled: this.isTruthy('SECONDARY_GATEWAYS_ENABLED'),
        mobileExternalPaymentsEnabled: this.isTruthy('MOBILE_EXTERNAL_PAYMENTS_ENABLED'),
        conversationScope: 'US/Canada only',
        verificationScope: 'Global SMS and voice',
        aiKillSwitchEnabled: this.isTruthy('AI_KILL_SWITCH'),
      },
      summary: this.buildSummary(integrations),
      groups,
      integrations,
    };
  }

  getReadiness() {
    const stack = this.getStack();
    const blockers = stack.integrations
      .filter((item) => item.priority !== 'secondary')
      .filter((item) => ['missing_env', 'partial'].includes(item.status))
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        missingEnv: item.requiredEnv.filter((env) => !env.configured).map((env) => env.name),
      }));

    return {
      status: blockers.length ? 'needs_configuration' : 'ready',
      generatedAt: stack.generatedAt,
      blockers,
      policies: stack.policies,
    };
  }

  getDeploymentReadiness(): DeploymentReadinessSnapshot {
    const targets = DEPLOYMENT_TARGETS.map((definition) => this.toDeploymentSnapshot(definition));
    const observabilityChecks = OBSERVABILITY_CHECKS.map((check) => {
      const requiredEnv = (check.requiredEnv ?? []).map((name) => ({
        name,
        configured: this.hasEnv(name),
      }));

      return {
        ...check,
        requiredEnv,
        status: requiredEnv.every((env) => env.configured) ? 'configured' as const : 'missing_env' as const,
      };
    });

    const blockers = targets
      .filter((target) => target.productionRequired)
      .filter((target) => ['missing_env', 'partial'].includes(target.status))
      .map((target) => ({
        id: target.id,
        name: target.name,
        category: target.category,
        status: target.status,
        missingEnv: target.requiredEnv.filter((env) => !env.configured).map((env) => env.name),
      }));

    const observabilityBlockers = observabilityChecks
      .filter((check) => check.releaseBlocker && check.status === 'missing_env')
      .map((check) => ({
        id: check.id,
        surface: check.surface,
        signal: check.signal,
        missingEnv: check.requiredEnv.filter((env) => !env.configured).map((env) => env.name),
      }));

    const groups = targets.reduce((acc, target) => {
      acc[target.category] = acc[target.category] || [];
      acc[target.category]!.push(target);
      return acc;
    }, {} as Partial<Record<DeploymentCategory, DeploymentTargetSnapshot[]>>);

    return {
      product: 'Burner Point',
      generatedAt: new Date().toISOString(),
      environment: this.config.get<string>('APP_ENV') || this.config.get<string>('NODE_ENV') || 'development',
      status: blockers.length || observabilityBlockers.length ? 'needs_configuration' : 'ready_for_release_gates',
      policies: {
        environments: ['development', 'staging', 'production'],
        productionBranch: 'main',
        sourceControl: 'GitHub',
        webDeployment: 'Vercel',
        apiDeployment: 'Railway',
        database: 'Neon Postgres',
        mobileDelivery: 'Expo / EAS',
        appStores: ['iOS App Store', 'Google Play Store'],
        secretsRule: 'Secrets live only in deployment secret stores or ignored local env files',
      },
      blockers,
      observabilityBlockers,
      groups,
      targets,
      environments: DEPLOYMENT_ENVIRONMENTS,
      releaseGates: RELEASE_GATES,
      observabilityChecks,
      commitStructure: COMMIT_STRUCTURE,
    };
  }

  private toSnapshot(definition: StackIntegrationDefinition): StackIntegrationSnapshot {
    const requiredEnv = (definition.requiredEnv ?? []).map((name) => ({
      name,
      configured: this.hasEnv(name),
    }));
    const optionalEnv = (definition.optionalEnv ?? []).map((name) => ({
      name,
      configured: this.hasEnv(name),
    }));

    return {
      ...definition,
      requiredEnv,
      optionalEnv,
      status: this.resolveStatus(definition, requiredEnv),
    };
  }

  private toDeploymentSnapshot(definition: DeploymentTargetDefinition): DeploymentTargetSnapshot {
    const requiredEnv = (definition.requiredEnv ?? []).map((name) => ({
      name,
      configured: this.hasEnv(name),
    }));
    const optionalEnv = (definition.optionalEnv ?? []).map((name) => ({
      name,
      configured: this.hasEnv(name),
    }));

    return {
      ...definition,
      requiredEnv,
      optionalEnv,
      status: this.resolveDeploymentStatus(definition, requiredEnv),
    };
  }

  private resolveDeploymentStatus(
    definition: DeploymentTargetDefinition,
    requiredEnv: Array<{ name: string; configured: boolean }>,
  ): DeploymentTargetStatus {
    if (definition.disabledWhenEnvTrue && this.isTruthy(definition.disabledWhenEnvTrue)) {
      return 'disabled';
    }

    if (definition.deferredUnlessEnv && !this.isTruthy(definition.deferredUnlessEnv)) {
      return 'deferred';
    }

    if (!requiredEnv.length) {
      return definition.stage === 'planned' ? 'planned' : 'ready';
    }

    const configuredCount = requiredEnv.filter((env) => env.configured).length;
    if (configuredCount === requiredEnv.length) return 'configured';
    if (configuredCount > 0) return 'partial';
    return definition.stage === 'planned' ? 'planned' : 'missing_env';
  }

  private resolveStatus(
    definition: StackIntegrationDefinition,
    requiredEnv: Array<{ name: string; configured: boolean }>,
  ): StackIntegrationStatus {
    if (definition.disabledWhenEnvTrue && this.isTruthy(definition.disabledWhenEnvTrue)) {
      return 'disabled';
    }

    if (definition.deferredUnlessEnv && !this.isTruthy(definition.deferredUnlessEnv)) {
      return 'deferred';
    }

    if (!requiredEnv.length) {
      return definition.statusWhenNoEnv ?? 'ready';
    }

    const configuredCount = requiredEnv.filter((env) => env.configured).length;
    if (configuredCount === requiredEnv.length) return 'configured';
    if (configuredCount > 0) return 'partial';
    return definition.statusWhenNoEnv ?? 'missing_env';
  }

  private buildSummary(integrations: StackIntegrationSnapshot[]): PlatformStackSnapshot['summary'] {
    const summary = {
      total: integrations.length,
      ready: 0,
      configured: 0,
      partial: 0,
      missing_env: 0,
      planned: 0,
      deferred: 0,
      disabled: 0,
    };

    for (const integration of integrations) {
      summary[integration.status] += 1;
    }

    return summary;
  }

  private hasEnv(name: string): boolean {
    return hasConfiguredEnv(name, this.config);
  }

  private isTruthy(name: string): boolean {
    return ['true', '1', 'yes', 'on'].includes((this.config.get<string>(name) ?? '').toLowerCase());
  }
}

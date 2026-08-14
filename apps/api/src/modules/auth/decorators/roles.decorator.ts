import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../database/entities/user.entity';

export const ROLES_METADATA_KEY = 'roles';

/** Declares the only application roles allowed to invoke a guarded endpoint. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);

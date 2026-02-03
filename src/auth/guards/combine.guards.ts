import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { OwnershipGuard } from './ownership.guard';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CombinedGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly rolesGuard: RolesGuard,
    private readonly ownershipGuard: OwnershipGuard,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtValid = await super.canActivate(context);
    if (!jwtValid) throw new UnauthorizedException('Invalid or missing JWT');

    const rolesValid = await this.rolesGuard.canActivate(context);
    if (!rolesValid) throw new ForbiddenException('Role not permitted');

    const ownershipValid = await this.ownershipGuard.canActivate(context);
    if (!ownershipValid) throw new ForbiddenException('Ownership check failed');

    return true;
  }
}
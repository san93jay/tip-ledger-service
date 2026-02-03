import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresOwnership = this.reflector.get<boolean>(
      'ownership',
      context.getHandler(),
    );

    if (!requiresOwnership) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const employeeIdParam = request.params.id;

    if (user.role === 'merchant') return true;

    if (user.role === 'employee' && user.employeeId === employeeIdParam) {
      return true;
    }

    throw new ForbiddenException('You do not have access to these tips');
  }
}
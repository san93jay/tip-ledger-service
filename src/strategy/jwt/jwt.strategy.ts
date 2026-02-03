import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'superSecretKey', // only for local
    });
  }

  async validate(payload: any) {
    return { sub: payload.sub, role: payload.role, email: payload.email , merchantId: payload.merchantId, employeeId:payload.employeeId};
  }
}
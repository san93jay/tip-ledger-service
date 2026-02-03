import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';
import { JwtStrategy } from '../strategy/jwt/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Employee } from 'src/entities/Employee.entity';
import { Merchant } from 'src/entities/Merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee, Merchant]),
    PassportModule,
    JwtModule.register({
      secret: 'superSecretKey', // my secret key
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
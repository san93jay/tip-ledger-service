import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Employee } from 'src/entities/Employee.entity';
import { Merchant } from 'src/entities/Merchant.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Employee) private employeesRepo: Repository<Employee>,
    @InjectRepository(Merchant) private merchantsRepo: Repository<Merchant>,

  ) {}

async signup(email: string, password: string, role: 'merchant' | 'employee', name: string, merchantId?: string) {
  const existing = await this.usersRepo.findOne({ where: { email } });
  if (existing) throw new BadRequestException('Email already exists');

  const hashed = await bcrypt.hash(password, 10);
  const user = this.usersRepo.create({ email, password: hashed, role, name });
  if (role === 'merchant') {
  const merchant = this.merchantsRepo.create({ name, user });
  await this.merchantsRepo.save(merchant);
  user.merchant = merchant;
  await this.usersRepo.save(user);
}

if (role === 'employee') {
  const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
  if (!merchant) throw new BadRequestException('Merchant not found');

  const employee = this.employeesRepo.create({ name, user, merchant });
  await this.employeesRepo.save(employee);

  user.employee = employee;
  await this.usersRepo.save(user);
}
  return {
    success: true,
    message: 'Signup successful',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
      merchantId: user.merchant?.id,
    },
  };
}

async login(email: string, password: string) {
  const user = await this.usersRepo.findOne({
    where: { email },
    relations: ['employee', 'merchant'],
  });

  if (!user) throw new UnauthorizedException('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedException('Invalid credentials');

  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    merchantId: user.role === 'merchant' ? user.merchant?.id : null,
    employeeId: user.role === 'employee' ? user.employee?.id : null
  };
  return {
    success: true,
    access_token: this.jwtService.sign(payload),
    role: user.role,
    id: user.id,
    name: user.name,
    merchantId: user.role === 'merchant' ? user.merchant?.id : null,
    employeeId: user.role === 'employee' ? user.employee?.id : null
  };
}
}
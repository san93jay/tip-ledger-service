import { Module } from '@nestjs/common';
import { MerchantsController } from "./merchants.controller";
import { MerchantsService } from "./merchants.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipIntent } from 'src/entities/TipIntent.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CombinedGuard } from 'src/auth/guards/combine.guards';
import { OwnershipGuard } from 'src/auth/guards/ownership.guard';
import { Employee } from 'src/entities/Employee.entity';
import { Merchant } from 'src/entities/Merchant.entity';
import { TableQR } from 'src/tables/TableQR.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipIntent,Merchant,
      TableQR,
      Employee,
      User,])],
  controllers: [MerchantsController],
  providers: [MerchantsService,RolesGuard, OwnershipGuard, CombinedGuard],
  exports: [CombinedGuard,MerchantsService],
})
export class MerchantsModule {}
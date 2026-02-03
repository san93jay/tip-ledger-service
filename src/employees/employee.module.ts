import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from 'src/entities/LedgerEntry.entity';
import { Employee } from 'src/entities/Employee.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { OwnershipGuard } from 'src/auth/guards/ownership.guard';
import { CombinedGuard } from 'src/auth/guards/combine.guards';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntry, Employee])],
  controllers: [EmployeesController],
  providers: [EmployeesService,RolesGuard, OwnershipGuard, CombinedGuard],
  exports: [CombinedGuard],
})
export class EmployeeModule {}
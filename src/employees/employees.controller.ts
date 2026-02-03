import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CombinedGuard } from 'src/auth/guards/combine.guards';
import { Ownership } from 'src/auth/decorator/ownership.decorator';

@Controller('employees')
@Roles('employee')
@UseGuards(CombinedGuard)
@Ownership()
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

@Get(':id/tips')
getEmployeeTips(@Param('id') id: string, @Req() req) {
  return this.employeesService.getEmployeeTips(id, req.user);
}

}
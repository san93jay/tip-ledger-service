import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CombinedGuard } from 'src/auth/guards/combine.guards';
import { Ownership } from 'src/auth/decorator/ownership.decorator';
import { CreateEmployeeDto } from 'src/dto/create-employee.dto';
import { CreateTableDto } from 'src/dto/create-table.dto';

@Controller('merchants')
@UseGuards(CombinedGuard)
@Roles('merchant')
@Ownership()
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Get(':id/tips/summary')
  getTipSummary(@Param('id') id: string) {
    return this.merchantsService.getTipSummary(id);
  }

   @Get('employees')
  async listEmployees(@Req() req) {
    const merchantId = req.user.merchantId;
     console.log("Merchant Id in merchant controller list employee"+ merchantId);
    return this.merchantsService.listEmployees(merchantId);
  }

  @Get('tables')
  async listTables(@Req() req) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.listTables(merchantId);
  }


  @Post('tables')
  async createTable(@Req() req, @Body() dto: CreateTableDto) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.createTable(merchantId, dto);
  }

  @Post('employees')
  async createEmployee(@Req() req, @Body() dto: CreateEmployeeDto) {
    const merchantId = req.user.merchantId;
    console.log("Merchant Id in merchant controller create employee"+ merchantId);
    return this.merchantsService.createEmployee(merchantId, dto);
  }

}
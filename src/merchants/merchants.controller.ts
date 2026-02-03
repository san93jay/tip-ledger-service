import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CombinedGuard } from 'src/auth/guards/combine.guards';
import { Ownership } from 'src/auth/decorator/ownership.decorator';
import { CreateEmployeeDto } from 'src/dto/create-employee.dto';
import { CreateTableDto } from 'src/dto/create-table.dto';
import { ApiTags, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TableResponseDto } from 'src/dto/create-table-response.dto';
import { EmployeeTipsDto } from 'src/dto/employee-tip.dto';

@ApiTags('Merchants')
@Controller('merchants')
@UseGuards(CombinedGuard)
@Roles('merchant')
@Ownership()
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Get(':id/tips/summary')
  @ApiParam({ name: 'id', description: 'Merchant ID' })
  @ApiResponse({ status: 200, type: EmployeeTipsDto })
  getTipSummary(@Param('id') id: string) {
    return this.merchantsService.getTipSummary(id);
  }

  @Get('employees')
  @ApiResponse({ status: 200, type: [CreateEmployeeDto] })
  async listEmployees(@Req() req) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.listEmployees(merchantId);
  }

  @Get('tables')
  @ApiResponse({ status: 200, type: [TableResponseDto] })
  async listTables(@Req() req) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.listTables(merchantId);
  }

  @Post('tables')
  @ApiBody({ type: CreateTableDto })
  @ApiResponse({ status: 201, type: TableResponseDto })
  async createTable(@Req() req, @Body() dto: CreateTableDto) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.createTable(merchantId, dto);
  }

  @Post('employees')
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, type: CreateEmployeeDto })
  async createEmployee(@Req() req, @Body() dto: CreateEmployeeDto) {
    const merchantId = req.user.merchantId;
    return this.merchantsService.createEmployee(merchantId, dto);
  }
}
import { Controller, Post, Body, Param } from '@nestjs/common';
import { TipsService } from './tips.service';
import { CreateTipIntentDto } from '../dto/create-tip-intent.dto';
import { LedgerResponseDto } from 'src/dto/ledger-response.dto';
import { TipIntentResponseDto } from 'src/dto/tip-intent-response.dto';
import { ApiTags, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TipIntentMapper } from 'src/utility/to-tip-intent-response.dt';

@ApiTags('Tips')
@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Post('intents')
  @ApiBody({ type: CreateTipIntentDto })
  @ApiResponse({ status: 201, type: TipIntentResponseDto })
  async createTipIntent(@Body() dto: CreateTipIntentDto): Promise<TipIntentResponseDto> {
   const intent = await this.tipsService.createTipIntent(dto);
    return TipIntentMapper.toResponseDto(intent);

  }

  @Post('intents/:id/confirm')
  @ApiParam({ name: 'id', description: 'Tip Intent ID' })
  @ApiResponse({ status: 200, type: LedgerResponseDto })
  async confirmIntent(@Param('id') id: string): Promise<LedgerResponseDto> {
    return this.tipsService.confirmTipIntent(id);
  }

  @Post('intents/:id/reverse')
  @ApiParam({ name: 'id', description: 'Tip Intent ID' })
  @ApiResponse({ status: 200, type: LedgerResponseDto })
  async reverseIntent(@Param('id') id: string): Promise<LedgerResponseDto> {
    return this.tipsService.reverseTipIntent(id);
  }
}
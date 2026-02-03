import { Controller, Post, Body, Param } from '@nestjs/common';
import { TipsService } from './tips.service';
import { CreateTipIntentDto } from '../dto/create-tip-intent.dto';
import { LedgerResponseDto } from 'src/dto/ledger-response.dto';
import { TipIntent } from 'src/entities/TipIntent.entity';
import { TipIntentResponseDto } from 'src/dto/tip-intent-response.dto';

@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}


@Post('intents')
  async createTipIntent(
    @Body() dto: CreateTipIntentDto): Promise<TipIntent> {
    return this.tipsService.createTipIntent(dto);
  }

  @Post('intents/:id/confirm')
  async confirmIntent(@Param('id') id: string): Promise<LedgerResponseDto> {
    return this.tipsService.confirmTipIntent(id);
  }

   @Post('intents/:id/reverse')
  async reverseIntent(@Param('id') id: string): Promise<LedgerResponseDto> {
    return this.tipsService.reverseTipIntent(id);
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { TipIntent } from '../entities/TipIntent.entity';
import { LedgerEntry } from 'src/entities/LedgerEntry.entity';
import { Merchant } from '../entities/Merchant.entity';
import { Employee } from '../entities/Employee.entity';
import { TableQR } from '../tables/TableQR.entity';
import { EventsPublisher } from 'src/messaging/events.publisher';

@Module({
  imports: [
    TypeOrmModule.forFeature([TipIntent, LedgerEntry, Merchant, Employee, TableQR]),
  ],
  providers: [TipsService,EventsPublisher],
  controllers: [TipsController],
})
export class TipsModule {}
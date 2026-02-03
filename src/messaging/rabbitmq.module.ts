import { TypeOrmModule } from "@nestjs/typeorm";
import { LedgerEntry } from "src/entities/LedgerEntry.entity";
import { EventsConsumer } from "./events.consumer";
import { EventsProducer } from "./events.producer";
import { EventsPublisher } from "./events.publisher";
import { Module } from '@nestjs/common';
@Module({
  providers: [EventsProducer, EventsPublisher,EventsConsumer],
  exports: [EventsProducer, EventsPublisher,EventsConsumer],
  imports: [TypeOrmModule.forFeature([LedgerEntry])],
})
export class RabbitMQModule {}
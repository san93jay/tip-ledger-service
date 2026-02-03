import { EventsConsumer } from "./events.consumer";
import { EventsProducer } from "./events.producer";
import { EventsPublisher } from "./events.publisher";
import { Module } from '@nestjs/common';
@Module({
  providers: [EventsProducer, EventsPublisher,EventsConsumer],
  exports: [EventsProducer, EventsPublisher,EventsConsumer],
})
export class RabbitMQModule {}
import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class EventsProducer {
  async emit(event: string, payload: any) {
    const conn = await amqp.connect('amqp://localhost');
    const ch = await conn.createChannel();
    await ch.assertExchange('tips.events', 'fanout', { durable: true });
    ch.publish('tips.events', '', Buffer.from(JSON.stringify({ event, payload })));
    await ch.close();
    await conn.close();
  }
}
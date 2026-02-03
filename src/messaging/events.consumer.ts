import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Connection, Channel } from 'amqplib';

@Injectable()
export class EventsConsumer implements OnModuleInit {
  private conn: Connection;
  private channel: Channel;
  private readonly logger = new Logger(EventsConsumer.name);

  async onModuleInit() {
    await this.connect();
    await this.consume();
  }

  private async connect() {
    this.conn = await require('amqplib').connect('amqp://localhost');
    this.channel = await this.conn.createChannel();
    await this.channel.assertExchange('tips.events', 'fanout', { durable: true });

    // Create a durable queue for tips events
    await this.channel.assertQueue('tips.queue', { durable: true });
    await this.channel.bindQueue('tips.queue', 'tips.events', '');
  }

  private async consume() {
    this.channel.consume('tips.queue', msg => {
      if (msg) {
        const content = msg.content.toString();
        const { event, payload } = JSON.parse(content);
        this.logger.log(`Received event: ${event}`);
        this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
        this.channel.ack(msg);
      }
    });
  }
}
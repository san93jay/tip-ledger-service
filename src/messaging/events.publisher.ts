import { Injectable } from '@nestjs/common';
import { Connection, Channel } from 'amqplib';
@Injectable()
export class EventsPublisher {
  private conn: Connection;
  private channel: Channel;

  async connect() {
    if (this.channel) return; // already connected
    this.conn = await require('amqplib').connect('amqp://localhost');
    this.channel = await this.conn.createChannel();
    await this.channel.assertExchange('tips.events', 'fanout', { durable: true });
  }

  async publish(event: string, payload: any) {
    await this.connect();
    const message = Buffer.from(JSON.stringify({ event, payload }));
    const ok = this.channel.publish('tips.events', '', message);
    if (!ok) {
      console.error('Publish failed (write buffer full)');
    }
  }
}
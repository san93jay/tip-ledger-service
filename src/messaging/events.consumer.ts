import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Connection, Channel } from 'amqplib';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry, LedgerType } from 'src/entities/LedgerEntry.entity';

@Injectable()
export class EventsConsumer implements OnModuleInit {
  private conn: Connection;
  private channel: Channel;
  private readonly logger = new Logger(EventsConsumer.name);

  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.consume();
  }

  private async connect() {
    this.conn = await require('amqplib').connect('amqp://localhost');
    this.channel = await this.conn.createChannel();
    await this.channel.assertExchange('tips.events', 'fanout', { durable: true });
    await this.channel.assertQueue('tips.queue', { durable: true });
    await this.channel.bindQueue('tips.queue', 'tips.events', '');
  }

  private async consume() {
    this.channel.consume('tips.queue', async msg => {
      if (!msg) return;

      try {
        const content = msg.content.toString();
        const { event, payload } = JSON.parse(content);

        this.logger.log(`Received event: ${event}`);

        switch (event) {
          case 'TIP_INTENT_CREATED':
            await this.processLedgerEvent(payload, LedgerType.INTENT);
            break;
          case 'TIP_CONFIRMED':
            await this.processLedgerEvent(payload, LedgerType.CONFIRM);
            break;
          case 'TIP_REVERSED':
            await this.processLedgerEvent(payload, LedgerType.REVERSAL);
            break;
          default:
            this.logger.warn(`Unknown event: ${event}`);
        }

        this.channel.ack(msg);
      } catch (err) {
        this.logger.error(`Failed to process message: ${err.message}`);
        this.channel.nack(msg, false, false);
      }
    });
  }

  private async processLedgerEvent(payload: any, type: LedgerType) {
    const tipIntentId = payload?.tipIntentId;
    const amountFils = payload?.amountFils;

    this.logger.debug(`Handling ${type} for ${tipIntentId}`);

    if (!tipIntentId || typeof amountFils !== 'number') {
      this.logger.error(`Missing or invalid tipIntent data`);
      return;
    }

    const existing = await this.ledgerRepo.findOne({
      where: { tipIntent: { id: tipIntentId }, type },
    });

    if (existing) {
      this.logger.log(`Duplicate ${type} ignored for ${tipIntentId}`);
      return;
    }

    const ledger = this.ledgerRepo.create({
      tipIntent: { id: tipIntentId } as any,
      amountFils,
      type,
    });

    await this.ledgerRepo.save(ledger);
    this.logger.log(`${type} processed for ${tipIntentId}`);
  }
}
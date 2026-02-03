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

    // Durable queue
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
            await this.handleTipIntentCreated(payload);
            break;
          case 'TIP_CONFIRMED':
            await this.handleTipConfirmed(payload);
            break;
          case 'TIP_REVERSED':
            await this.handleTipReversed(payload);
            break;
          default:
            this.logger.warn(`Unknown event: ${event}`);
        }

        this.channel.ack(msg);
      } catch (err) {
        this.logger.error(`Failed to process message: ${err.message}`);
        // Optionally: nack with requeue=false to avoid infinite retries
        this.channel.nack(msg, false, false);
      }
    });
  }

  private async handleTipIntentCreated(payload: any) {
    this.logger.debug(`Handling TIP_INTENT_CREATED for ${payload.id}`);

    // Idempotency check: has this intent already been recorded?
    const existing = await this.ledgerRepo.findOne({
      where: { tipIntent: { id: payload.id }, type: LedgerType.INTENT },
    });

    if (existing) {
      this.logger.log(`Duplicate TIP_INTENT_CREATED ignored for ${payload.id}`);
      return;
    }

    // Record the intent creation in the ledger
    const ledger = this.ledgerRepo.create({
      tipIntent: { id: payload.id } as any,
      amountFils: payload.amountFils,
      type: LedgerType.INTENT,
    });

    await this.ledgerRepo.save(ledger);
    this.logger.log(`TIP_INTENT_CREATED processed for ${payload.id}`);
  }

  private async handleTipConfirmed(payload: any) {
    this.logger.debug(`Handling TIP_CONFIRMED for ${payload.tipIntent?.id}`);

    const existing = await this.ledgerRepo.findOne({
      where: { tipIntent: { id: payload.tipIntent?.id }, type: LedgerType.CONFIRM },
    });

    if (existing) {
      this.logger.log(`Duplicate TIP_CONFIRMED ignored for ${payload.tipIntent?.id}`);
      return;
    }

    await this.ledgerRepo.save(payload);
    this.logger.log(`TIP_CONFIRMED processed for ${payload.tipIntent?.id}`);
  }

  private async handleTipReversed(payload: any) {
    this.logger.debug(`Handling TIP_REVERSED for ${payload.tipIntent?.id}`);

    const existing = await this.ledgerRepo.findOne({
      where: { tipIntent: { id: payload.tipIntent?.id }, type: LedgerType.REVERSAL },
    });

    if (existing) {
      this.logger.log(`Duplicate TIP_REVERSED ignored for ${payload.tipIntent?.id}`);
      return;
    }

    await this.ledgerRepo.save(payload);
    this.logger.log(`TIP_REVERSED processed for ${payload.tipIntent?.id}`);
  }
}
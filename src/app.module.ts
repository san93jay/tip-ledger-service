import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { TipsModule } from './tips/tips.module';
import { RabbitMQModule } from './messaging/rabbitmq.module';
import { MerchantsModule } from './merchants/merchant.module';
import { EmployeeModule } from './employees/employee.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sanjayuma',
      database: 'ecom',
      schema: 'ecom-ledger',
      autoLoadEntities: true,
      synchronize: true, // local setup  only
}),
TipsModule,
RabbitMQModule,
MerchantsModule,
EmployeeModule,
AuthModule,


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

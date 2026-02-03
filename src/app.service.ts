import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welocome To ECom Payments , Sanjay Vishwakarma';
  }
}

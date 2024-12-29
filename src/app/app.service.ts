import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    throw Error('GET HELLO')
    return 'Hello World!';
  }
}

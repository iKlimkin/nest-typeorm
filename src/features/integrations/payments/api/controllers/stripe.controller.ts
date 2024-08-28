import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RouterPaths } from '../../../../../infra/utils/routing';
import { RawBodyAndSignature } from '../../../../auth/infrastructure/decorators/extract-stripe-session-event.decorator';
import { StripeSignatureGuard } from '../../../../auth/infrastructure/guards/stripe-signature.guard';
import { HandlePaymentAfterSuccessCommand } from '../../application/use-cases/handle-payment-after-success.use-case';
import { RequestRawBodyAndSignature } from '../models/input/req-raw-body-signature';
import { HandlePaymentCommand } from '../../application/use-cases/handle-payment-webhook.use-case';

@Controller(RouterPaths.integrations.stripe)
export class StripeController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get('membership/success')
  async handleStripeSuccess(@Query('session_id') sessionId: string) {
    const { data: customer } = await this.commandBus.execute(
      new HandlePaymentAfterSuccessCommand(sessionId),
    );
    return `<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`;
  }

  @Get('membership/failed')
  async handleFailedPayment(@Body() event: any) {
    // await this.commandBus.execute(new HandleFailedPaymentCommand(event));
    const message = `operation is failed`;
    return message;
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  @UseGuards(StripeSignatureGuard)
  async forStripeHook(@RawBodyAndSignature() req: RequestRawBodyAndSignature) {
    const command = new HandlePaymentCommand(req.signature, req.rawBody);
    return this.commandBus.execute(command);
  }
}

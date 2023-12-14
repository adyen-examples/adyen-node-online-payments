import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private paymentService: PaymentsService) {}

  @Get('/alive')
  getStatus(): string {
    return 'ALIVE';
  }

  @Get('/paymentMethods')
  postPaymentMethods(): Promise<any> {
    return this.paymentService.postForPaymentMethods();
  }

  @Post('/payments')
  postPayments(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForPayments(requestBody);
  }

  @Post('/sessions')
  postSessions(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForSessions(requestBody.data);
  }

  @Post('/paymentDetails')
  postPaymentDetails(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForPaymentDetails(requestBody.data);
  }
}

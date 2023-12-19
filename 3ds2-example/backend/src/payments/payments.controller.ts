import { Body, Controller, Get, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller()
export class PaymentsController {
  constructor(private paymentService: PaymentsService) {}

  @Get("/paymentMethods")
  postPaymentMethods(): Promise<any> {
    return this.paymentService.postForPaymentMethods();
  }

  @Post("/payments/redirect")
  postPaymentsRedirect(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForPaymentsRedirect(requestBody);
  }

  @Post("/payments/native")
  postPaymentsNative(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForPaymentsNative(requestBody);
  }

  @Post("/sessions")
  postSessions(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForSessions(requestBody.data);
  }

  @Post("/paymentDetails")
  postPaymentDetails(@Body() requestBody: any): Promise<any> {
    return this.paymentService.postForPaymentDetails(requestBody.data);
  }
}

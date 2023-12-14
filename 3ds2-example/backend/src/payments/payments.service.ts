/**
 * This payments service does NOT use the CheckoutAPI
 * It calls the API endpoints with axios
 * (For typing clarity though I am using the models exposed in the node-api-library)
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import {
  PaymentMethodsResponse,
  PaymentResponse,
  PaymentRequest,
  AuthenticationData,
  ThreeDSRequestData,
  PaymentDetailsResponse,
  PaymentCompletionDetails,
  CreateCheckoutSessionResponse,
  CreateCheckoutSessionRequest,
} from '@adyen/api-library/lib/src/typings/checkout/models';

@Injectable()
export class PaymentsService {
  API_KEY: string;
  MERCHANT_ACCOUNT: string;
  BASE_URL: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.API_KEY = this.configService.get<string>('API_KEY');
    this.BASE_URL = this.configService.get<string>('BASE_URL');
    this.MERCHANT_ACCOUNT = this.configService.get<string>('MERCHANT_ACCOUNT');
  }

  async postForPaymentMethods(): Promise<PaymentMethodsResponse> {
    const url = `${this.BASE_URL}/paymentMethods`;

    const headers: AxiosRequestConfig['headers'] = {
      'x-api-key': this.API_KEY,
      'Content-Type': 'application/json',
    };
    const postData = {
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const { data } = await firstValueFrom(
      this.httpService.post<any>(url, postData, { headers }).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }

  /**
   * This method is just a wrapper to route to the correct flow based on the flow parameter which will be NATIVE or REDIRECT
   * This is an implementation detail of this test app and not related to the 3DS2 flow or integraiton itself.
   * 
   * For both native or redirect the more information you pass to the /payments request the higher chance for a frictionless flow (no challenge)
   * we recommend you at least pass these fields: 
   *  countryCode: string;
      shopperName: {
        firstName: string;
        lastName: string;
      },
      shopperIP: string;
      shopperEmail: string;
      Please note: 
      it is better to omit these fields than pass static values, only populate these with real data from your shopper, otherwise it could result in higher challenge rate
   */
  async postForPayments({ data, url, flow }): Promise<PaymentResponse> {
    if (flow === 'NATIVE') {
      // example of payment request for native flow
      return this.postForPaymentsNative({ data, url });
    } else {
      // example of payment request for redirect flow
      return this.postForPaymentsRedirect({ data, url });
    }
  }

  async postForPaymentsRedirect({ data, url }): Promise<PaymentResponse> {
    const checkout_url = `${this.BASE_URL}/payments`;
    const headers: AxiosRequestConfig['headers'] = {
      'x-api-key': this.API_KEY,
    };

    const paymentRequestData: PaymentRequest = {
      amount: {
        currency: 'EUR',
        value: 1000,
      },
      countryCode: 'NL',
      shopperName: {
        firstName: 'Test',
        lastName: 'Shopper',
      },
      shopperIP: 'http://192.0.2.1/',
      shopperEmail: 'testshopper@madeupemail.com',
      channel: PaymentRequest.ChannelEnum.Web,
      browserInfo: data.browserInfo,
      origin: url,
      reference: 'AUTH_INTEGRATIONS_TEST_APP',
      paymentMethod: data.paymentMethod, // this is the paymentMethod object from the state.data object returned from the submit on the dropin component from the client
      returnUrl: url, // the url you want the shopper to be returned to after redirect (this url is where the redirectData will be appended to on redirect back)
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const { data: response } = await firstValueFrom(
      this.httpService
        .post<any>(checkout_url, paymentRequestData, { headers })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happened!';
          }),
        ),
    );
    return response;
  }

  async postForPaymentsNative({ data, url }): Promise<PaymentResponse> {
    const checkout_url = `${this.BASE_URL}/payments`;
    const headers: AxiosRequestConfig['headers'] = {
      'x-api-key': this.API_KEY,
    };

    const authenticationData: AuthenticationData = {
      threeDSRequestData: {
        challengeWindowSize: ThreeDSRequestData.ChallengeWindowSizeEnum._01, // here you can pass the size of the challenge window, this defaults to 05 which is 100%
        nativeThreeDS: ThreeDSRequestData.NativeThreeDSEnum.Preferred, // set 'preferred' for Native
      },
    };

    const paymentRequestData: PaymentRequest = {
      amount: {
        currency: 'EUR',
        value: 1000,
      },
      authenticationData: {
        ...authenticationData,
      },
      countryCode: 'NL',
      shopperName: {
        firstName: 'Test',
        lastName: 'Shopper',
      },
      shopperIP: 'http://192.0.2.1/',
      shopperEmail: 'testshopper@madeupemail.com',
      channel: PaymentRequest.ChannelEnum.Web, // required for native
      browserInfo: data.browserInfo, // required for native
      origin: url, // required for native
      reference: 'AUTH_INTEGRATIONS_TEST_APP',
      paymentMethod: data.paymentMethod, // this is the paymentMethod object from the state.data object returned from the submit on the dropin component from the client
      returnUrl: url,
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const { data: response } = await firstValueFrom(
      this.httpService
        .post<any>(checkout_url, paymentRequestData, { headers })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happened!';
          }),
        ),
    );
    return response;
  }

  async postForPaymentDetails({
    details,
  }: {
    details: PaymentCompletionDetails;
  }): Promise<PaymentDetailsResponse> {
    const url = `${this.BASE_URL}/payments/details`;

    const headers: AxiosRequestConfig['headers'] = {
      'x-api-key': this.API_KEY,
      'Content-Type': 'application/json',
    };

    const { data } = await firstValueFrom(
      this.httpService.post<any>(url, { details }, { headers }).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }

  async postForSessions({ url }): Promise<CreateCheckoutSessionResponse> {
    const checkout_url = `${this.BASE_URL}/sessions`;
    const headers: AxiosRequestConfig['headers'] = {
      'x-api-key': this.API_KEY,
    };

    const sessionsRequestData: CreateCheckoutSessionRequest = {
      amount: {
        currency: 'EUR',
        value: 1000,
      },
      channel: PaymentRequest.ChannelEnum.Web,
      reference: 'AUTH_INTEGRATIONS_TEST_APP',
      returnUrl: url,
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const { data } = await firstValueFrom(
      this.httpService
        .post<any>(checkout_url, sessionsRequestData, { headers })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happened!';
          }),
        ),
    );
    return data;
  }
}

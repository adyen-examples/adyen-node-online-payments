/**
 * This payments service uses the CheckoutAPI from the @adyen/api-library to make payment requests
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, CheckoutAPI } from '@adyen/api-library';
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
import { PaymentsApi } from '@adyen/api-library/lib/src/services/checkout/paymentsApi';

@Injectable()
export class PaymentsService {
  API_KEY: string;
  MERCHANT_ACCOUNT: string;

  paymentsAPI: PaymentsApi;

  constructor(private configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('API_KEY');
    this.MERCHANT_ACCOUNT = this.configService.get<string>('MERCHANT_ACCOUNT');

    // initialise the client object
    const client: Client = new Client({
      apiKey: this.API_KEY,
      environment: 'TEST',
    });

    // intialise the API object with the client object
    this.paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI exports a number of helpers for different API's, since we want to use Payments API we want a reference to PaymentsAPI
  }

  async postForPaymentMethods(): Promise<PaymentMethodsResponse> {
    const postData = {
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const paymentMethodsResponse: PaymentMethodsResponse =
      await this.paymentsAPI.paymentMethods({
        ...postData,
      });

    return paymentMethodsResponse;
  }

  /**
   * example of payment request for native flow
   * */
  async postForPaymentsNative({ data, url }): Promise<PaymentResponse> {
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

    const paymentResponse: PaymentResponse = await this.paymentsAPI.payments(
      paymentRequestData,
    );

    return paymentResponse;
  }
  /**
   * example of payment request for redirect flow, redirect flow is the default flow for 3DS2
   * */
  async postForPaymentsRedirect({ data, url }): Promise<PaymentResponse> {
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
      browserInfo: data.browserInfo, // this is the browserInfo object from the state.data object returned from the submit event on the dropin or component from the client
      origin: url,
      reference: 'AUTH_INTEGRATIONS_TEST_APP',
      paymentMethod: data.paymentMethod, // this is the paymentMethod object from the state.data object returned from the submit event on the dropin or component from the client
      returnUrl: url, // the url you want the shopper to be returned to after redirect (this url is where the redirectData will be appended to on redirect back)
      merchantAccount: this.MERCHANT_ACCOUNT,
    };

    const paymentResponse: PaymentResponse = await this.paymentsAPI.payments(
      paymentRequestData,
    );

    return paymentResponse;
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

  // if redirect we want to pass the redirectResult which was appended to our returnURL in the details property of the paymentDetailsRequest object
  // if native we want to pass the state.data response from the onAdditionalDetails event in the dropin in the details property of the paymentDetailsRequest object
  async postForPaymentDetails({
    details,
  }: {
    details: PaymentCompletionDetails;
  }): Promise<PaymentDetailsResponse> {
    const paymentDetailsResponse: PaymentDetailsResponse =
      await this.paymentsAPI.paymentsDetails({ details });

    return paymentDetailsResponse;
  }

  async postForSessions({ url }): Promise<CreateCheckoutSessionResponse> {
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

    const sessionsResponse = await this.paymentsAPI.sessions(
      sessionsRequestData,
    );
    return sessionsResponse;
  }
}

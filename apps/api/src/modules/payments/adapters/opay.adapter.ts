import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { resolveApiUrl } from '../../../config/runtime-env';

@Injectable()
export class OpayAdapter {
  private readonly logger = new Logger(OpayAdapter.name);

  constructor(private cfg: ConfigService) {}

  async initialize(params: { email: string; amountKobo: number; reference: string }) {
    const baseUrl = this.cfg.get('OPAY_BASE_URL', 'https://sandboxapi.opayweb.com');
    const payload = {
      reference: params.reference,
      mchShortName: 'BurnerPoint',
      productName: 'Credits',
      productDesc: 'BurnerPoint wallet top-up',
      supplierReference: params.reference,
      callbackUrl: `${resolveApiUrl(this.cfg)}/payments/webhook/opay`,
      returnUrl: `${this.cfg.get('WEB_URL')}/dashboard/billing?ref=${params.reference}`,
      expireAt: 30,
      userInfo: { userEmail: params.email },
      amount: { total: params.amountKobo / 100, currency: 'NGN' },
    };
    const { data } = await axios.post(`${baseUrl}/api/v1/international/cashier/create`, payload, {
      headers: { Authorization: `Bearer ${this.cfg.get('OPAY_PUBLIC_KEY')}`, MerchantId: this.cfg.get('OPAY_MERCHANT_ID'), 'Content-Type': 'application/json' },
    });
    return { checkoutUrl: data.data?.cashierUrl, orderNo: data.data?.orderNo };
  }

  async verify(_reference: string): Promise<boolean> {
    return false; // Implemented via webhook in production
  }
}

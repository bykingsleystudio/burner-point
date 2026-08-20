import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaystackAdapter {
  private readonly logger = new Logger(PaystackAdapter.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private get headers() {
    return { Authorization: `Bearer ${this.cfg.get('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json' };
  }

  constructor(private cfg: ConfigService) {}

  async initialize(params: { email: string; amountUsdCents: number; reference: string; callbackUrl?: string }) {
    const { data } = await axios.post(`${this.baseUrl}/transaction/initialize`, {
      email: params.email,
      amount: params.amountUsdCents,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: 'NGN',
    }, { headers: this.headers });
    return { checkoutUrl: data.data.authorization_url, accessCode: data.data.access_code };
  }

  async verify(reference: string): Promise<boolean> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, { headers: this.headers });
      return data.data?.status === 'success';
    } catch (e) {
      this.logger.error(`Paystack verify failed: ${e.message}`);
      return false;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { resolveApiUrl } from '../../../config/runtime-env';

@Injectable()
export class KorapayAdapter {
  private readonly logger = new Logger(KorapayAdapter.name);
  private readonly baseUrl = 'https://api.korapay.com/merchant/api/v1';

  constructor(private cfg: ConfigService) {}

  private get headers() {
    return { Authorization: `Bearer ${this.cfg.get('KORAPAY_SECRET_KEY')}`, 'Content-Type': 'application/json' };
  }

  async initialize(params: { email: string; amountKobo: number; reference: string }) {
    const { data } = await axios.post(`${this.baseUrl}/charges/initialize`, {
      reference: params.reference,
      amount: params.amountKobo / 100,
      currency: 'NGN',
      customer: { email: params.email },
      redirect_url: `${this.cfg.get('WEB_URL')}/dashboard/billing?ref=${params.reference}`,
      notification_url: `${resolveApiUrl(this.cfg)}/payments/webhook/korapay`,
    }, { headers: this.headers });
    return { checkoutUrl: data.data?.checkout_url, reference: params.reference };
  }

  async verify(reference: string): Promise<boolean> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/charges/${reference}`, { headers: this.headers });
      return data.data?.status === 'success';
    } catch {
      return false;
    }
  }
}

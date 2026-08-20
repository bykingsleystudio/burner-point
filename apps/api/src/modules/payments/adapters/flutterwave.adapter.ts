import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FlutterwaveAdapter {
  private readonly logger = new Logger(FlutterwaveAdapter.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private get headers() {
    return { Authorization: `Bearer ${this.cfg.get('FLUTTERWAVE_SECRET_KEY')}`, 'Content-Type': 'application/json' };
  }

  constructor(private cfg: ConfigService) {}

  async initialize(params: { email: string; amountUsdCents: number; reference: string; callbackUrl?: string }) {
    const { data } = await axios.post(`${this.baseUrl}/payments`, {
      tx_ref: params.reference,
      amount: params.amountUsdCents / 100,
      currency: 'NGN',
      redirect_url: params.callbackUrl,
      customer: { email: params.email },
      customizations: { title: 'Burner Point Credits', logo: 'https://burnerpoint.com/assets/logo-mark.svg' },
    }, { headers: this.headers });
    return { checkoutUrl: data.data?.link, link: data.data?.link };
  }

  async verify(txRef: string): Promise<boolean> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${txRef}`, { headers: this.headers });
      return data.data?.status === 'successful';
    } catch (e) {
      this.logger.error(`Flutterwave verify failed: ${e.message}`);
      return false;
    }
  }
}

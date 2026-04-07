import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SquadAdapter {
  private readonly logger = new Logger(SquadAdapter.name);

  constructor(private cfg: ConfigService) {}

  private get headers() {
    return { Authorization: `Bearer ${this.cfg.get('SQUAD_SECRET_KEY')}`, 'Content-Type': 'application/json' };
  }

  async initialize(params: { email: string; amountKobo: number; reference: string; callbackUrl?: string }) {
    const baseUrl = this.cfg.get('SQUAD_BASE_URL', 'https://sandbox-api-d.squadco.com');
    const { data } = await axios.post(`${baseUrl}/transaction/initiate`, {
      email: params.email,
      amount: params.amountKobo,
      currency: 'NGN',
      transaction_ref: params.reference,
      callback_url: params.callbackUrl,
      pass_charge: false,
    }, { headers: this.headers });
    return { checkoutUrl: data.data?.checkout_url, transactionRef: params.reference };
  }

  async verify(reference: string): Promise<boolean> {
    try {
      const baseUrl = this.cfg.get('SQUAD_BASE_URL', 'https://sandbox-api-d.squadco.com');
      const { data } = await axios.get(`${baseUrl}/transaction/verify/${reference}`, { headers: this.headers });
      return data.data?.transaction_status === 'success';
    } catch (e) {
      this.logger.error(`Squad verify failed: ${e.message}`);
      return false;
    }
  }
}

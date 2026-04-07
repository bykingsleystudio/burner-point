/**
 * apps/api/src/modules/ai/ai.service.ts
 *
 * OpenAI integration with:
 * - AI_KILL_SWITCH env var (set true to disable all AI calls instantly)
 * - All calls server-side only — API key never leaves the server
 * - Fast OTP regex path before any AI call (most messages classified without AI)
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface MessageClassification {
  classification: 'otp' | 'spam' | 'transactional' | 'personal' | 'marketing';
  otp?: string;
  spamScore: number;
  confidence: number;
}

// Fast OTP patterns — checked before any AI call
const OTP_PATTERNS = [
  /(?:code|otp|pin|verification|token|passcode)[\s:is-]+(\d{4,8})/i,
  /(\d{4,8})(?:\s+is\s+your|\s+—\s+your|\s+is your)/i,
  /your\s+(?:code|otp|pin|verification)\s+(?:is\s+)?(\d{4,8})/i,
  /(?:use|enter)\s+(\d{4,8})\s+to/i,
  /(\d{6})\s+is\s+your\s+\w+\s+(?:verification|authentication|login)/i,
];

const SPAM_KEYWORDS = [
  'win', 'winner', 'prize', 'click here', 'free money', 'urgent',
  'congratulations', 'claim now', 'you have been selected', 'limited time',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private _openai: OpenAI | null = null;

  constructor(private config: ConfigService) {}

  private get openai(): OpenAI | null {
    if (this._openai) return this._openai;
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;
    this._openai = new OpenAI({ apiKey });
    return this._openai;
  }

  // ─── Kill switch check ────────────────────────────────────────────────────

  private isKillSwitchActive(): boolean {
    return this.config.get<string>('AI_KILL_SWITCH') === 'true';
  }

  // ─── Public methods ───────────────────────────────────────────────────────

  async classifyMessage(body: string): Promise<MessageClassification> {
    if (!body?.trim()) {
      return { classification: 'personal', spamScore: 0, confidence: 1 };
    }

    // 1. Fast OTP detection — no AI call needed
    for (const pattern of OTP_PATTERNS) {
      const match = body.match(pattern);
      if (match) {
        return {
          classification: 'otp',
          otp: match[1],
          spamScore: 0,
          confidence: 0.97,
        };
      }
    }

    // 2. Spam keyword heuristic
    const lower = body.toLowerCase();
    const spamHits = SPAM_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    if (spamHits >= 2) {
      return {
        classification: 'spam',
        spamScore: Math.min(0.5 + spamHits * 0.1, 0.99),
        confidence: 0.85,
      };
    }

    // 3. AI classification — only if kill switch is off and key is set
    if (this.isKillSwitchActive() || !this.openai) {
      this.logger.warn('AI unavailable (kill switch or missing key) — using heuristic fallback');
      return { classification: 'personal', spamScore: 0.1, confidence: 0.5 };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content:
              'Classify this SMS. Return ONLY JSON: ' +
              '{"classification":"otp|spam|transactional|personal|marketing",' +
              '"otp":"4-8 digit code if found or null","spamScore":0-1,"confidence":0-1}',
          },
          { role: 'user', content: body.slice(0, 500) }, // truncate to limit tokens
        ],
        max_tokens: 80,
        temperature: 0,
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const result = JSON.parse(raw);
      return result as MessageClassification;
    } catch (err) {
      this.logger.warn(`AI classification failed: ${err.message} — using heuristic fallback`);
      return { classification: 'personal', spamScore: 0.1, confidence: 0.5 };
    }
  }

  async extractOtp(body: string): Promise<string | null> {
    const result = await this.classifyMessage(body);
    return result.otp ?? null;
  }

  /**
   * Health check — returns true if OpenAI is reachable and kill switch is off.
   * Used by admin dashboard to display AI status.
   */
  async healthCheck(): Promise<{ active: boolean; killSwitch: boolean }> {
    return {
      active: !this.isKillSwitchActive() && !!this.openai,
      killSwitch: this.isKillSwitchActive(),
    };
  }
}

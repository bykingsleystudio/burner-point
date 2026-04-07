import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NumbersService } from '../numbers/numbers.service';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(private numbersService: NumbersService) {}

  /**
   * Runs every hour to expire phone numbers past their TTL.
   * Also handles auto-renewal for numbers with autoRenew=true.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireNumbers() {
    this.logger.log('Running number lifecycle TTL check...');
    try {
      const now = new Date();
      const expiring = await this.numbersService.findExpiring(now);

      if (!expiring.length) {
        this.logger.log('No numbers to expire');
        return;
      }

      const toExpire: string[] = [];
      const toRenew: { id: string; userId: string }[] = [];

      for (const num of expiring) {
        if (num.autoRenew && num.userId) {
          toRenew.push({ id: num.id, userId: num.userId });
        } else {
          toExpire.push(num.id);
        }
      }

      // Expire numbers
      if (toExpire.length) {
        await this.numbersService.expireNumbers(toExpire);
        this.logger.log(`Expired ${toExpire.length} numbers`);
      }

      // Auto-renew numbers (best-effort, fails gracefully)
      for (const { id, userId } of toRenew) {
        try {
          await this.numbersService.renew(id, userId);
          this.logger.log(`Auto-renewed number ${id}`);
        } catch (e) {
          this.logger.warn(`Auto-renewal failed for ${id}: ${e.message} — expiring instead`);
          await this.numbersService.expireNumbers([id]);
        }
      }
    } catch (err) {
      this.logger.error(`Lifecycle cron failed: ${err.message}`, err.stack);
    }
  }

  /** Runs at midnight to clean up old expired numbers from provider records */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredNumbers() {
    this.logger.log('Running nightly cleanup of expired numbers...');
    // Additional cleanup logic can be added here
  }
}

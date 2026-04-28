import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, TransactionType } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BillingService } from '../billing-v2/billing.service';

// Wallet is stored in USD cents (legacy column name "kobo").
// Referral bonuses are small USD incentives.
const REFERRER_BONUS_USD_CENTS = 50; // $0.50
const REFEREE_BONUS_USD_CENTS = 25; // $0.25

@Injectable()
export class GrowthService {
  constructor(
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private usersService: UsersService,
    private billingService: BillingService,
  ) {}

  async processReferral(referrerId: string, refereeId: string) {
    const existing = await this.referralRepo.findOne({ where: { referrerId, refereeId } });
    if (existing) return;

    const referral = this.referralRepo.create({
      referrerId, refereeId,
      referrerBonusKobo: REFERRER_BONUS_USD_CENTS,
      refereeBonusKobo: REFEREE_BONUS_USD_CENTS,
    });
    await this.referralRepo.save(referral);

    // Credit both parties
    const referrer = await this.usersService.creditWallet(referrerId, REFERRER_BONUS_USD_CENTS);
    await this.userRepo.increment({ id: referrerId }, 'referralCount', 1);
    const referee = await this.usersService.creditWallet(refereeId, REFEREE_BONUS_USD_CENTS);

    await this.billingService.recordWalletTransaction({
      userId: referrerId,
      type: TransactionType.REFERRAL_BONUS,
      amountKobo: REFERRER_BONUS_USD_CENTS,
      balanceAfterKobo: Number(referrer.walletBalanceKobo),
      description: 'Referral reward credited',
      referenceId: referral.id,
      metadata: { role: 'referrer', refereeId },
    });

    await this.billingService.recordWalletTransaction({
      userId: refereeId,
      type: TransactionType.REFERRAL_BONUS,
      amountKobo: REFEREE_BONUS_USD_CENTS,
      balanceAfterKobo: Number(referee.walletBalanceKobo),
      description: 'Referral welcome credit',
      referenceId: referral.id,
      metadata: { role: 'referee', referrerId },
    });

    await this.referralRepo.update(referral.id, { status: 'completed', bonusPaid: true });
    return referral;
  }

  async getReferralStats(userId: string) {
    const [referrals, total] = await this.referralRepo.findAndCount({ where: { referrerId: userId } });
    const totalEarned = referrals.reduce((sum, r) => sum + Number(r.referrerBonusKobo), 0);
    return { totalReferrals: total, totalEarnedKobo: totalEarned, referrals };
  }

  async getLeaderboard() {
    return this.userRepo.find({
      where: {},
      order: { referralCount: 'DESC' },
      take: 10,
      select: ['id', 'firstName', 'lastName', 'referralCode', 'referralCount'],
    });
  }
}

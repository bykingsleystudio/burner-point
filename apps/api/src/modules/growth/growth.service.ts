import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

const REFERRER_BONUS_KOBO = 50000;  // ₦500
const REFEREE_BONUS_KOBO  = 25000;  // ₦250

@Injectable()
export class GrowthService {
  constructor(
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async processReferral(referrerId: string, refereeId: string) {
    const existing = await this.referralRepo.findOne({ where: { referrerId, refereeId } });
    if (existing) return;

    const referral = this.referralRepo.create({
      referrerId, refereeId,
      referrerBonusKobo: REFERRER_BONUS_KOBO,
      refereeBonusKobo: REFEREE_BONUS_KOBO,
    });
    await this.referralRepo.save(referral);

    // Credit both parties
    await this.userRepo.increment({ id: referrerId }, 'walletBalanceKobo', REFERRER_BONUS_KOBO);
    await this.userRepo.increment({ id: referrerId }, 'referralCount', 1);
    await this.userRepo.increment({ id: refereeId }, 'walletBalanceKobo', REFEREE_BONUS_KOBO);

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

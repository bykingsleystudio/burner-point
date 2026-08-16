const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseAuthService } = require('../src/modules/auth/supabase-auth.service.ts');

test('phone-only profiles do not require a generated email', () => {
  const service = Object.create(SupabaseAuthService.prototype);

  const missing = service.getMissingProfileFields({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: undefined,
    phoneNumber: '+2348000000000',
    termsAccepted: true,
    privacyAccepted: true,
  });

  assert.deepEqual(missing, []);
});

test('phone-only Supabase users can sync without inventing an email', async () => {
  const service = Object.create(SupabaseAuthService.prototype);
  service.userRepo = {
    create: (input) => ({ ...input }),
    save: async (user) => user,
  };
  service.generateReferralCode = () => 'ABC123';

  const saved = await service.syncLocalUserFromSupabaseAuthUser(
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phone: '+2348000000000',
      user_metadata: {
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
      app_metadata: { provider: 'google' },
      identities: [{ provider: 'google' }],
    },
    null,
    '127.0.0.1',
  );

  assert.equal(saved.phoneNumber, '+2348000000000');
  assert.equal(saved.firstName, 'Ada');
  assert.equal(saved.lastName, 'Lovelace');
});

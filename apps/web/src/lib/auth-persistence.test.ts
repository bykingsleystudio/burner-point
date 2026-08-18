import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAuthStorageMode, getRememberMePreference, setRememberMePreference } from './auth-persistence';

test('remember-me toggles between local and session storage modes', () => {
  setRememberMePreference(true);
  assert.equal(getRememberMePreference(), true);
  assert.equal(resolveAuthStorageMode(), 'localStorage');

  setRememberMePreference(false);
  assert.equal(getRememberMePreference(), false);
  assert.equal(resolveAuthStorageMode(), 'sessionStorage');
});

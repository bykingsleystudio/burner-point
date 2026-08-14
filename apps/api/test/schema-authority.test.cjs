require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');

test('TypeORM maps entities without owning schema migrations', () => {
  const { AppDataSource } = require('../src/database/data-source');

  assert.equal(
    AppDataSource.options.migrations,
    undefined,
    'Supabase SQL migrations are the sole schema authority',
  );
});

test('core entities map to the canonical Supabase snake_case columns', () => {
  const { getMetadataArgsStorage } = require('typeorm');
  const { PhoneNumber } = require('../src/database/entities/phone-number.entity');
  const { Message } = require('../src/database/entities/message.entity');
  const { Call } = require('../src/database/entities/extended-entities');

  const columnName = (target, propertyName) => getMetadataArgsStorage()
    .columns
    .find((column) => column.target === target && column.propertyName === propertyName)
    ?.options.name;

  assert.equal(columnName(PhoneNumber, 'number'), 'phone_number');
  assert.equal(columnName(Message, 'from'), 'from_number');
  assert.equal(columnName(Message, 'to'), 'to_number');
  assert.equal(columnName(Message, 'userId'), 'user_id');
  assert.equal(columnName(Message, 'phoneNumberId'), 'phone_number_id');
  assert.equal(columnName(Message, 'providerMessageSid'), 'provider_message_id');
  assert.equal(columnName(Call, 'from'), 'from_number');
  assert.equal(columnName(Call, 'to'), 'to_number');
  assert.equal(columnName(Call, 'userId'), 'user_id');
  assert.equal(columnName(Call, 'phoneNumberId'), 'phone_number_id');
});

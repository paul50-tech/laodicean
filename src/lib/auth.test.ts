import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  formatPersonaName,
  isAdminEmail,
  validatePersonaName,
  validateRealName,
} from './auth';

test('isAdminEmail identifies pauljubilee50@gmail.com regardless of casing', () => {
  assert.equal(isAdminEmail('pauljubilee50@gmail.com'), true);
  assert.equal(isAdminEmail('PaulJubilee50@GMAIL.com'), true);
  assert.equal(isAdminEmail('otherstudent@jkuat.ac.ke'), false);
  assert.equal(isAdminEmail(null), false);
  assert.equal(isAdminEmail(''), false);
});

test('validateRealName checks minimum length and empty input', () => {
  assert.equal(validateRealName(''), 'Please enter your real display name.');
  assert.equal(validateRealName('A'), 'Name must be at least 2 characters.');
  assert.equal(validateRealName('Brian Kiprop'), null);
});

test('formatPersonaName ensures leading @ and lowercases clean handle', () => {
  assert.equal(formatPersonaName('juja_falcon'), '@juja_falcon');
  assert.equal(formatPersonaName('@Juja_Falcon'), '@juja_falcon');
  assert.equal(formatPersonaName('Juja Falcon 254'), '@juja_falcon_254');
});

test('validatePersonaName enforces character limits and alphanumeric rules', () => {
  assert.equal(validatePersonaName(''), 'Please provide a persona name.');
  assert.equal(validatePersonaName('ab'), 'Persona name must be at least 3 characters.');
  assert.equal(validatePersonaName('@ab'), 'Persona name must be at least 3 characters.');
  assert.equal(validatePersonaName('valid_persona_123'), null);
  assert.equal(validatePersonaName('@valid_handle'), null);
  assert.equal(
    validatePersonaName('invalid persona!'),
    'Persona name can only contain letters, numbers, and underscores.'
  );
});

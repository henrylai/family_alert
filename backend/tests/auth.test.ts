import assert from 'node:assert/strict';
import test from 'node:test';

// auth.ts reads APP_PASSWORD lazily from the environment on every call,
// so tests can set and clear it freely within this file's process.
import { SESSION_COOKIE_MAX_AGE_MS, authEnabled, isAuthenticated, isAuthenticatedCookie, issueSessionToken, parseCookies, passwordMatches, sessionTokenAge } from '../src/auth.js';

process.env.APP_PASSWORD = 'correct horse battery staple';

const reqWithCookie = (cookie?: string) => ({ headers: { cookie } }) as never;

test('gate is enabled only when APP_PASSWORD is set', () => {
  assert.equal(authEnabled(), true);
  delete process.env.APP_PASSWORD;
  assert.equal(authEnabled(), false);
  // With no password configured the gate lets everything through.
  assert.equal(isAuthenticated(reqWithCookie()), true);
  process.env.APP_PASSWORD = 'correct horse battery staple';
});

test('session cookie lasts 400 days, the browser maximum', () => {
  assert.equal(SESSION_COOKIE_MAX_AGE_MS, 400 * 24 * 60 * 60 * 1000);
});

test('password matching is exact', () => {
  assert.equal(passwordMatches('correct horse battery staple'), true);
  assert.equal(passwordMatches('correct horse battery'), false);
  assert.equal(passwordMatches('Correct horse battery staple'), false);
  assert.equal(passwordMatches(''), false);
});

test('session token is a signed timestamp that follows the password', () => {
  const now = 1_800_000_000_000;
  const token = issueSessionToken(now);
  assert.match(token, /^\d+\.[0-9a-f]{64}$/);
  assert.equal(sessionTokenAge(token, now), 0);
  assert.equal(sessionTokenAge(token, now + 3 * 24 * 60 * 60 * 1000), 3 * 24 * 60 * 60);
  // Changing the password invalidates tokens it did not issue.
  process.env.APP_PASSWORD = 'a different password';
  assert.equal(sessionTokenAge(token, now), null);
  process.env.APP_PASSWORD = 'correct horse battery staple';
  assert.equal(sessionTokenAge(token, now), 0);
});

test('forged or malformed tokens have no age', () => {
  const now = 1_800_000_000_000;
  const token = issueSessionToken(now);
  const [issuedAt, signature] = token.split('.');
  assert.equal(sessionTokenAge(`${Number(issuedAt) - 1000}.${signature}`, now), null);
  assert.equal(sessionTokenAge(`${issuedAt}.${signature!.slice(0, -1)}0`, now), null);
  assert.equal(sessionTokenAge('not-a-token', now), null);
  assert.equal(sessionTokenAge('', now), null);
  assert.equal(sessionTokenAge(undefined, now), null);
});

test('cookie parsing reads the session cookie among others', () => {
  const cookies = parseCookies('theme=dark; family_alert_session=abc123; other=x%20y');
  assert.equal(cookies.family_alert_session, 'abc123');
  assert.equal(cookies.theme, 'dark');
  assert.equal(cookies.other, 'x y');
  assert.deepEqual(parseCookies(undefined), {});
});

test('isAuthenticated accepts only a genuinely signed session token', () => {
  assert.equal(isAuthenticated(reqWithCookie(`family_alert_session=${issueSessionToken()}`)), true);
  assert.equal(isAuthenticated(reqWithCookie('family_alert_session=deadbeef')), false);
  assert.equal(isAuthenticated(reqWithCookie('theme=dark')), false);
  assert.equal(isAuthenticated(reqWithCookie()), false);
});

test('socket handshake check uses the same cookie', () => {
  assert.equal(isAuthenticatedCookie(`family_alert_session=${issueSessionToken()}`), true);
  assert.equal(isAuthenticatedCookie('family_alert_session=deadbeef'), false);
  assert.equal(isAuthenticatedCookie(undefined), false);
});

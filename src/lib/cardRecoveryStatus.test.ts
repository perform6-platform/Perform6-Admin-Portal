import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CARD_RECOVERY_REVOKE_WARNING,
  cardRecoveryStatusDetail,
  cardRecoveryStatusHeadline,
  normalizeCardRecoveryStatus,
} from './cardRecoveryStatus.ts';

describe('card recovery status UI helpers', () => {
  it('normalizes allowed approval from API', () => {
    const status = normalizeCardRecoveryStatus({
      state: 'allowed',
      allowed: true,
      expiresAt: '2026-11-25T12:00:00.000Z',
      approvedAt: '2026-11-25T11:45:00.000Z',
      approvedByUserId: 'admin-1',
      grantId: 'g1',
      usedAt: null,
      cancelledAt: null,
      claimedFromIp: null,
    });
    assert.equal(status.state, 'allowed');
    assert.equal(cardRecoveryStatusHeadline(status), 'Recovery allowed');
    assert.match(cardRecoveryStatusDetail(status, 'noon'), /revoked immediately/i);
    assert.match(CARD_RECOVERY_REVOKE_WARNING, /old card/i);
  });

  it('normalizes successful claim', () => {
    const status = normalizeCardRecoveryStatus({
      state: 'used',
      allowed: false,
      expiresAt: '2026-11-25T12:00:00.000Z',
      usedAt: '2026-11-25T11:50:00.000Z',
      approvedByUserId: 'admin-1',
      approvedAt: '2026-11-25T11:45:00.000Z',
      grantId: 'g1',
      cancelledAt: null,
      claimedFromIp: '203.0.113.9',
    });
    assert.equal(status.state, 'used');
    assert.equal(cardRecoveryStatusHeadline(status), 'Recovery used successfully');
    assert.match(cardRecoveryStatusDetail(status), /203\.0\.113\.9/);
    assert.match(cardRecoveryStatusDetail(status), /revoked immediately/i);
  });

  it('normalizes cancelled and expired', () => {
    const cancelled = normalizeCardRecoveryStatus({
      state: 'cancelled',
      allowed: false,
      cancelledAt: '2026-11-25T11:46:00.000Z',
      expiresAt: '2026-11-25T12:00:00.000Z',
      approvedAt: null,
      approvedByUserId: null,
      grantId: 'g2',
      usedAt: null,
      claimedFromIp: null,
    });
    assert.equal(cardRecoveryStatusHeadline(cancelled), 'Recovery cancelled');

    const expired = normalizeCardRecoveryStatus({
      state: 'expired',
      allowed: false,
      expiresAt: '2026-11-25T11:00:00.000Z',
      approvedAt: null,
      approvedByUserId: null,
      grantId: 'g3',
      usedAt: null,
      cancelledAt: null,
      claimedFromIp: null,
    });
    assert.equal(cardRecoveryStatusHeadline(expired), 'Recovery expired');
  });

  it('surfaces API load errors', () => {
    const status = normalizeCardRecoveryStatus(null, 'Request failed with status 500');
    assert.equal(status.state, 'error');
    assert.equal(cardRecoveryStatusHeadline(status), 'Recovery error');
    assert.match(cardRecoveryStatusDetail(status), /500/);
  });

  it('confirm copy always warns that the old token is revoked', () => {
    assert.match(CARD_RECOVERY_REVOKE_WARNING, /token is revoked/i);
  });
});

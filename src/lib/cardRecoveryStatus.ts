export type CardRecoveryState =
  | 'none'
  | 'allowed'
  | 'used'
  | 'cancelled'
  | 'expired'
  | 'error';

export interface CardRecoveryStatusView {
  state: CardRecoveryState;
  allowed: boolean;
  grantId: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  cancelledAt: string | null;
  claimedFromIp: string | null;
  errorMessage?: string | null;
}

export const CARD_RECOVERY_REVOKE_WARNING =
  'When the replacement card successfully claims credentials, the old card’s API token is revoked immediately and that player can no longer authenticate.';

export function normalizeCardRecoveryStatus(
  input: Partial<CardRecoveryStatusView> | null | undefined,
  errorMessage?: string | null,
): CardRecoveryStatusView {
  if (errorMessage) {
    return {
      state: 'error',
      allowed: false,
      grantId: null,
      approvedAt: null,
      approvedByUserId: null,
      expiresAt: null,
      usedAt: null,
      cancelledAt: null,
      claimedFromIp: null,
      errorMessage,
    };
  }

  const state = (input?.state as CardRecoveryState | undefined) ?? 'none';
  return {
    state,
    allowed: Boolean(input?.allowed && state === 'allowed'),
    grantId: input?.grantId ?? null,
    approvedAt: input?.approvedAt ?? null,
    approvedByUserId: input?.approvedByUserId ?? null,
    expiresAt: input?.expiresAt ?? null,
    usedAt: input?.usedAt ?? null,
    cancelledAt: input?.cancelledAt ?? null,
    claimedFromIp: input?.claimedFromIp ?? null,
    errorMessage: null,
  };
}

export function cardRecoveryStatusHeadline(status: CardRecoveryStatusView): string {
  switch (status.state) {
    case 'allowed':
      return 'Recovery allowed';
    case 'used':
      return 'Recovery used successfully';
    case 'cancelled':
      return 'Recovery cancelled';
    case 'expired':
      return 'Recovery expired';
    case 'error':
      return 'Recovery error';
    default:
      return 'Card recovery';
  }
}

export function cardRecoveryStatusDetail(
  status: CardRecoveryStatusView,
  expiresLabel?: string | null,
): string {
  switch (status.state) {
    case 'allowed':
      return [
        expiresLabel
          ? `Open until ${expiresLabel}. Insert the new startup card and reboot.`
          : 'Insert the new startup card and reboot within the approval window.',
        CARD_RECOVERY_REVOKE_WARNING,
        'This running player keeps working until that claim succeeds.',
      ].join(' ');
    case 'used':
      return [
        'A replacement card claimed a new token.',
        status.claimedFromIp ? `Claimant IP: ${status.claimedFromIp}.` : null,
        CARD_RECOVERY_REVOKE_WARNING,
      ]
        .filter(Boolean)
        .join(' ');
    case 'cancelled':
      return 'The approval window was cancelled. Allow card recovery again before a blank card can claim a token.';
    case 'expired':
      return 'The approval window expired unused. Allow card recovery again if you still need a blank card.';
    case 'error':
      return status.errorMessage ?? 'Could not load card recovery status.';
    default:
      return 'Required before a blank startup card can get a token for this serial. No new deployment.';
  }
}

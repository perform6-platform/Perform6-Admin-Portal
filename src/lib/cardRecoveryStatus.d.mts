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

export const CARD_RECOVERY_REVOKE_WARNING: string;

export function normalizeCardRecoveryStatus(
  input: Partial<CardRecoveryStatusView> | null | undefined,
  errorMessage?: string | null,
): CardRecoveryStatusView;

export function cardRecoveryStatusHeadline(status: CardRecoveryStatusView): string;

export function cardRecoveryStatusDetail(
  status: CardRecoveryStatusView,
  expiresLabel?: string | null,
): string;

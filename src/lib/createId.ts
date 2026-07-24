/** UUID v4 via getRandomValues — works on HTTP / non-secure origins. */
function uuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `id-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

/** App-facing id helper — never calls crypto.randomUUID (avoids insecure-context / polyfill loops). */
export function createId(): string {
  return uuidV4();
}

/** Patch global crypto so any accidental randomUUID() calls work on HTTP. */
export function ensureRandomUuid(): void {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID === 'function') {
    return;
  }
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: uuidV4,
  });
}

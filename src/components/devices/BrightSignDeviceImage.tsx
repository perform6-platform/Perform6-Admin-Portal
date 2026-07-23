export function BrightSignDeviceImage() {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      className="mx-auto h-28 w-full max-w-[160px]"
    >
      <defs>
        <linearGradient id="device-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="device-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect x="28" y="18" width="104" height="72" rx="10" fill="url(#device-body)" />
      <rect x="36" y="26" width="88" height="48" rx="4" fill="url(#device-screen)" />
      <rect x="52" y="92" width="56" height="8" rx="4" fill="#6d28d9" />
      <circle cx="80" cy="96" r="2" fill="#c4b5fd" />
    </svg>
  );
}

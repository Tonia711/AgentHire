const FUJI_BASE = "https://testnet.snowtrace.io";

export function txUrl(hash: string): string {
  return `${FUJI_BASE}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${FUJI_BASE}/address/${address}`;
}

export function shortenHash(hash: string, head = 6, tail = 4): string {
  if (!hash) return "";
  if (hash.length <= head + tail + 2) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

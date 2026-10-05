import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isUsStateCode } from "@shared/us-state-codes";

const DNS_TIMEOUT_MS = 2_500;
type AddressResolver = (hostname: string) => Promise<string[]>;

function ipv6ToBigInt(value: string): bigint | null {
  if (value.includes("%")) return null;
  let canonical: string;
  try {
    const hostname = new URL(`http://[${value}]/`).hostname;
    if (!hostname.startsWith("[") || !hostname.endsWith("]")) return null;
    canonical = hostname.slice(1, -1).toLowerCase();
  } catch {
    return null;
  }
  if (canonical.includes(".")) return null;
  const halves = canonical.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const zeroGroups = 8 - left.length - right.length;
  if ((halves.length === 1 && zeroGroups !== 0) || (halves.length === 2 && zeroGroups < 1)) return null;
  const groups = [...left, ...Array.from({ length: zeroGroups }, () => "0"), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[\da-f]{1,4}$/.test(group))) return null;
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
}

function ipv6MatchesPrefix(address: bigint, prefix: string, prefixLength: number): boolean {
  const prefixValue = ipv6ToBigInt(prefix);
  if (prefixValue === null) return false;
  const mask = ((1n << BigInt(prefixLength)) - 1n) << BigInt(128 - prefixLength);
  return (address & mask) === (prefixValue & mask);
}

function isPublicIpv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPublicIpv6(host: string): boolean {
  const address = ipv6ToBigInt(host);
  if (address === null) return false;

  if (ipv6MatchesPrefix(address, "2001:db8::", 32)) return false;

  // IANA's IPv6 Special-Purpose Address Registry marks this translation
  // prefix globally reachable; still reject it when the embedded IPv4 is not
  // public. Other non-global entries outside 2000::/3 fail the final check.
  if (ipv6MatchesPrefix(address, "64:ff9b::", 96)) {
    const embeddedIpv4 = Number(address & 0xffff_ffffn);
    const octets = [24, 16, 8, 0].map(shift => (embeddedIpv4 >>> shift) & 255);
    return isPublicIpv4(octets.join("."));
  }

  // Source: IANA IPv6 Special-Purpose Address Registry
  // (https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml).
  // It marks 2001::/23 non-global except for more-specific globally reachable
  // allocations. Keep those exact exceptions; the rest is reserved.
  if (ipv6MatchesPrefix(address, "2001::", 23)) {
    const globallyReachableExceptions: Array<[string, number]> = [
      ["2001:1::1", 128],
      ["2001:1::2", 128],
      ["2001:1::3", 128],
      ["2001:3::", 32],
      ["2001:4:112::", 48],
      ["2001:20::", 28],
      ["2001:30::", 28],
    ];
    if (!globallyReachableExceptions.some(([prefix, length]) => ipv6MatchesPrefix(address, prefix, length))) return false;
  }

  if (ipv6MatchesPrefix(address, "2002::", 16) ||
      ipv6MatchesPrefix(address, "3fff::", 20) ||
      ipv6MatchesPrefix(address, "5f00::", 16)) return false;

  const firstGroup = Number((address >> 112n) & 0xffffn);
  return Number.isFinite(firstGroup) && (firstGroup & 0xe000) === 0x2000;
}

function isPublicIp(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? isPublicIpv4(address) : family === 6 ? isPublicIpv6(address) : false;
}

function parsedPublicHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
        host.endsWith(".internal") || host.endsWith(".home.arpa") || host.endsWith(".lan")) return null;
    const family = isIP(host);
    if (family && !isPublicIp(host)) return null;
    if (!family && (!host.includes(".") || host.split(".").some(label => !label || label.length > 63))) return null;
    return url;
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string): boolean {
  return parsedPublicHttpUrl(value) !== null;
}

export function parseCommunityCityStateLabel(value: string): { city: string; state: string } | null {
  const match = value.trim().match(/^([\p{L}\p{M}\p{N} .,'’\-]{2,80}),\s*([A-Za-z]{2})$/u);
  if (!match || !/\p{L}/u.test(match[1])) return null;
  const state = match[2].toUpperCase();
  if (!isUsStateCode(state)) return null;
  return { city: match[1].trim(), state };
}

async function resolveAddresses(hostname: string): Promise<string[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map(result => result.address);
}

async function resolveWithTimeout(hostname: string, resolver: AddressResolver): Promise<string[]> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      resolver(hostname),
      new Promise<string[]>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("DNS resolution timed out")), DNS_TIMEOUT_MS);
        timeout.unref?.();
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/** A public HTTP(S) URL must use a public IP literal or resolve only to public addresses. */
export async function isPublicHttpUrl(value: string, resolver: AddressResolver = resolveAddresses): Promise<boolean> {
  const url = parsedPublicHttpUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (isIP(host)) return isPublicIp(host);
  try {
    const addresses = await resolveWithTimeout(host, resolver);
    return addresses.length > 0 && addresses.every(isPublicIp);
  } catch {
    return false;
  }
}

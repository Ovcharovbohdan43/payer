/** Prohibited / high-risk keywords (case-insensitive). Extend via PUyer admin policy. */
const PROHIBITED_PATTERNS: RegExp[] = [
  /\bcrypto\s*mining\b/i,
  /\bforex\b/i,
  /\bbinary\s*options\b/i,
  /\bcasino\b/i,
  /\bgambling\b/i,
  /\bescort\b/i,
  /\badult\s*content\b/i,
  /\bweapons?\b/i,
  /\bammunition\b/i,
  /\bdrugs?\b/i,
  /\bnarcotics\b/i,
  /\bcounterfeit\b/i,
  /\bfake\s*(id|passport|document)/i,
  /\bpyramid\s*scheme\b/i,
  /\bmlm\b/i,
  /\bunlicensed\s*financial\b/i,
  /\bmoney\s*launder/i,
  /\bstolen\s*goods\b/i,
  /\bchargeback\s*fraud\b/i,
  /\bonlyfans\b/i,
  /\bscam\b/i,
];

export type ProhibitedScanResult = {
  flagged: boolean;
  matches: string[];
};

export function scanProhibitedContent(...texts: (string | null | undefined)[]): ProhibitedScanResult {
  const haystack = texts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) {
    return { flagged: false, matches: [] };
  }

  const matches: string[] = [];
  for (const pattern of PROHIBITED_PATTERNS) {
    const m = haystack.match(pattern);
    if (m?.[0]) matches.push(m[0]);
  }

  return { flagged: matches.length > 0, matches: [...new Set(matches)] };
}

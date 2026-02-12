/**
 * Humanize Acumatica API error messages into user-friendly form.
 */

const ERROR_PATTERNS: { pattern: RegExp; transform: (match: RegExpMatchArray) => string }[] = [
  // PX.Data.PXException prefix — strip it
  {
    pattern: /^PX\.[\w.]+Exception:\s*(.+)/i,
    transform: (m) => humanizeError(m[1]),
  },
  // "Error: 'XYZ' cannot be found in the system."
  {
    pattern: /Error:\s*'([^']+)'\s*cannot be found/i,
    transform: (m) => `Record "${m[1]}" was not found in Acumatica`,
  },
  // "Inserting 'X' record raised at least one error"
  {
    pattern: /Inserting\s+'([^']+)'\s+record\s+raised\s+at\s+least\s+one\s+error[.:]\s*(.*)/i,
    transform: (m) => {
      const inner = m[2]?.trim();
      return inner
        ? `Failed to create ${m[1]} record: ${humanizeError(inner)}`
        : `Failed to create ${m[1]} record`;
    },
  },
  // "An error occurred during processing" with inner message
  {
    pattern: /An error occurred during processing[^.]*\.\s*(.*)/i,
    transform: (m) => {
      const inner = m[1]?.trim();
      return inner ? humanizeError(inner) : "An error occurred during processing";
    },
  },
  // Duplicate key / already exists
  {
    pattern: /duplicate key|already exists|unique constraint|violates unique/i,
    transform: () => "A record with this key already exists",
  },
  // Missing required field
  {
    pattern: /(?:required field|cannot be empty|is required)[^'"]*['"]([^'"]+)['"]/i,
    transform: (m) => `Required field "${m[1]}" is missing or empty`,
  },
  // Generic "Error #X:" prefix from Acumatica
  {
    pattern: /^Error\s*#?\d+:\s*(.*)/i,
    transform: (m) => humanizeError(m[1]),
  },
  // "The record has been deleted by another process" or concurrency
  {
    pattern: /record has been deleted|another process/i,
    transform: () =>
      "The record was modified or deleted by another process. Try again.",
  },
  // Timeout
  {
    pattern: /timeout|timed out/i,
    transform: () => "The request timed out. The Acumatica server may be busy.",
  },
  // Authentication failure
  {
    pattern: /unauthorized|authentication failed|login failed/i,
    transform: () =>
      "Authentication failed. Check your connection credentials.",
  },
];

/**
 * Transform raw Acumatica error text into a human-readable message.
 * Applies pattern matching and strips technical prefixes.
 */
export function humanizeError(raw: string | null | undefined): string {
  if (!raw) return "Unknown error";

  const trimmed = raw.trim();
  if (!trimmed) return "Unknown error";

  // Try each pattern
  for (const { pattern, transform } of ERROR_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return transform(match);
    }
  }

  // Fallback: strip common noisy prefixes
  let cleaned = trimmed
    .replace(/^Error:\s*/i, "")
    .replace(/^Exception:\s*/i, "")
    .trim();

  // Limit length
  if (cleaned.length > 300) {
    cleaned = cleaned.slice(0, 297) + "...";
  }

  return cleaned || "Unknown error";
}

/**
 * Extract the innermost exception message from a nested Acumatica error.
 */
export function extractInnerMessage(error: {
  message?: string;
  exceptionMessage?: string;
  innerException?: { message?: string; exceptionMessage?: string; innerException?: unknown };
}): string {
  // Dig into inner exceptions
  let current: typeof error | undefined = error;
  let deepest = error.exceptionMessage || error.message || "";

  while (current?.innerException) {
    const inner = current.innerException as typeof error;
    if (inner.exceptionMessage || inner.message) {
      deepest = inner.exceptionMessage || inner.message || deepest;
    }
    current = inner;
  }

  return humanizeError(deepest);
}
